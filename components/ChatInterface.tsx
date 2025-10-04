import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tutor, ChatMessage, MessageAuthor, QuizQuestion, Flashcard } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI, Chat, Type, Content } from '@google/genai';
import QuizView from './QuizView';
import FlashcardView from './FlashcardView';

interface ChatInterfaceProps {
  tutor: Tutor;
  onClose: () => void;
}

// Em um aplicativo real, NUNCA exponha sua chave de API no código do lado do cliente.
// Use variáveis de ambiente e um backend para proteger sua chave.
const GEMINI_API_KEY = "AIzaSyB_FQvyfvHCpzyr8rJWUZxPvwKN5BQnQa8";

type View = 'chat' | 'quiz' | 'flashcards';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ tutor, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [currentView, setCurrentView] = useState<View>('chat');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);


  // Efeito para fechar o menu de ferramentas ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSystemInstruction = useCallback((currentTutor: Tutor): string => {
    let finalSystemInstruction = currentTutor.persona;
    
    if (currentTutor.knowledge && currentTutor.knowledge.trim().length > 0) {
      finalSystemInstruction += `\n\n### REGRAS ADICIONAIS IMPORTANTES ###\n- Sua principal fonte de conhecimento é um documento de contexto fornecido a seguir. Você DEVE basear suas respostas exclusivamente neste documento.\n- Se a pergunta do aluno não puder ser respondida usando o contexto, você deve dizer claramente: "Não encontrei a resposta para isso no material de apoio."\n- NÃO use conhecimento externo ou geral.\n\n--- INÍCIO DO CONTEXTO ---\n${currentTutor.knowledge}\n--- FIM DO CONTEXTO ---`;
    } else {
      finalSystemInstruction += `\n\n### REGRAS ADICIONAIS IMPORTANTES ###\n- Você NÃO recebeu um documento de contexto. Baseie suas respostas em seu conhecimento geral sobre o assunto. Se o aluno mencionar um documento ou material de apoio, informe-o de que nenhum foi fornecido a você.`;
    }

    if (currentTutor.webSources && currentTutor.webSources.length > 0) {
      const sourcesList = currentTutor.webSources.map(s => `- ${s.title}: ${s.uri}`).join('\n');
      finalSystemInstruction += `\n\n### FONTES DA WEB PARA CONSULTA ###\nAo usar a busca na web, dê prioridade para encontrar informações nas seguintes fontes, se relevantes para a pergunta do aluno:\n${sourcesList}`;
    }
    
    const toolsInstructions = {
        adaptiveLearning: "\n\nCAPACIDADE ADICIONAL: Você é um tutor adaptativo. Sua principal diretriz é avaliar continuamente o nível de compreensão do aluno com base em suas respostas. - Se o aluno demonstrar dificuldade ou cometer erros, você deve simplificar o conteúdo, usar analogias mais simples e dividir os problemas em etapas menores. - Se o aluno mostrar domínio e responder correctly, você deve gradualmente aumentar a complexidade, introduzir tópicos relacionados e fazer perguntas mais desafiadoras. O objetivo é personalizar a experiência de aprendizado em tempo real para se adequar ao ritmo do aluno, mantendo-o engajado e desafiado na medida certa. Faça essa adaptação de forma natural na conversa.",
        quizGenerator: "\n\nCAPACIDADE ADICIONAL: Você também é um Gerador de Quiz. Se o aluno pedir um quiz, um teste, ou para ser testado, crie perguntas (múltipla escolha ou dissertativas) com base no seu conhecimento. Sempre forneça as respostas corretas e explicações depois que o aluno tentar responder.",
        conceptExplainer: "\n\nCAPACIDADE ADICIONAL: Você também é um Explicador de Conceitos. Se o aluno pedir para explicar um tópico complexo, divida-o em partes simples, use analogias e explique como se estivesse falando com um iniciante.",
        scenarioSimulator: "\n\nCAPACIDADE ADICIONAL: Você também é um Simulador de Cenários. Se o aluno pedir para iniciar uma simulação ou um role-play, você deve assumir o papel de um personagem (como uma figura histórica, um personagem de livro, etc.) e interagir com o aluno para ajudá-lo a praticar ou entender uma situação.",
        selfReflection: "\n\nCAPACIDADE ADICIONAL: Você deve incentivar a autorreflexão. Após explicar um conceito ou depois que o aluno responder a uma pergunta, faça perguntas de acompanhamento como 'O que foi mais desafiador para você entender sobre isso?', 'Como você explicaria isso com suas próprias palavras?', ou 'Onde você acha que poderia aplicar este conceito?'.",
        chainOfThought: "\n\nCAPACIDADE ADICIONAL: Ao resolver um problema ou responder a uma pergunta complexa, você DEVE usar um raciocínio de Cadeia de Pensamento (Chain-of-Thought). Explique seu processo passo a passo, mostrando como você chegou à solução. Isso ajuda o aluno a seguir sua lógica.",
        treeOfThoughts: "\n\nCAPACIDADE ADICIONAL: Para problemas que podem ter múltiplas abordagens, você deve usar um método de Árvore de Pensamentos (Tree-of-Thoughts). Explore diferentes caminhos ou soluções em potencial, apresente-os ao aluno e discuta os prós e contras de cada um para guiar à melhor resposta."
    };

    for (const [key, value] of Object.entries(currentTutor.tools || {})) {
        if (value && toolsInstructions[key as keyof typeof toolsInstructions]) {
            finalSystemInstruction += toolsInstructions[key as keyof typeof toolsInstructions];
        }
    }

    return finalSystemInstruction;
}, []);

  useEffect(() => {
    let initialMessages: ChatMessage[] = [];
    const storedHistory = localStorage.getItem(`chat_history_${tutor.id}`);

    if (storedHistory) {
        try {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                initialMessages = parsedHistory;
            }
        } catch (error) {
            console.error("Falha ao analisar o histórico do chat, começando de novo.", error);
        }
    }

    if (initialMessages.length === 0) {
        initialMessages = [{
            author: MessageAuthor.MODEL,
            text: `Olá! Eu sou ${tutor.name}, seu tutor de ${tutor.subject}. Como posso te ajudar hoje?`
        }];
    }
    setMessages(initialMessages);

    try {
        if (!GEMINI_API_KEY) throw new Error("Chave de API do Gemini não encontrada.");
        
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const finalSystemInstruction = getSystemInstruction(tutor);
        const config: any = { systemInstruction: finalSystemInstruction };
        if (tutor.tools?.webSearch) {
            config.tools = [{ googleSearch: {} }];
        }

        const historyForGemini: Content[] = initialMessages
            .filter(msg => msg.text)
            .map(msg => ({
                role: msg.author === MessageAuthor.USER ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: config,
            history: historyForGemini,
        });
        setChat(newChat);

    } catch (error) {
        console.error("Falha ao inicializar o chat do Gemini:", error);
        setMessages(prev => [...prev, {
            author: MessageAuthor.MODEL,
            text: "Desculpe, não consegui iniciar a sessão de chat. Verifique a configuração da API."
        }]);
    }
  }, [tutor, getSystemInstruction]);

  useEffect(() => {
    if (messages.length > 1) {
        try {
            localStorage.setItem(`chat_history_${tutor.id}`, JSON.stringify(messages));
        } catch (error) {
            console.error("Falha ao salvar o histórico do chat:", error);
        }
    }
  }, [messages, tutor.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: input };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: messageToSend });
      const modelResponseText = response.text;
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks
          ?.map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri && web.title);

      const modelResponse: ChatMessage = {
        author: MessageAuthor.MODEL,
        text: modelResponseText,
        sources: sources && sources.length > 0 ? sources : undefined,
      };
      setMessages(prev => [...prev, modelResponse]);
      
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      const errorMessage: ChatMessage = {
        author: MessageAuthor.MODEL,
        text: 'Desculpe, ocorreu um erro ao se comunicar com a IA. Por favor, tente novamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chat]);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Tem certeza de que deseja apagar o histórico desta conversa? Esta ação não pode ser desfeita.')) {
        try {
            localStorage.removeItem(`chat_history_${tutor.id}`);
            
            const initialMessage = {
                author: MessageAuthor.MODEL,
                text: `Olá! Eu sou ${tutor.name}, seu tutor de ${tutor.subject}. Como posso te ajudar hoje?`
            };
            setMessages([initialMessage]);
            
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
            const finalSystemInstruction = getSystemInstruction(tutor);
            const config: any = { systemInstruction: finalSystemInstruction };
            if (tutor.tools?.webSearch) {
                config.tools = [{ googleSearch: {} }];
            }

            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: config,
            });
            setChat(newChat);

        } catch (error) {
            console.error("Falha ao limpar o histórico do chat:", error);
            alert("Ocorreu um erro ao limpar o histórico do chat.");
        }
    }
  }, [tutor, getSystemInstruction]);

 const handleGenerateQuiz = useCallback(async () => {
    if (!chat || isLoading) return;
    setIsToolsMenuOpen(false);
    setIsLoading(true);
    setMessages(prev => [...prev, { author: MessageAuthor.MODEL, text: "Ok, estou preparando um quiz para você..."}]);

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const topic = messages.filter(m => m.author === MessageAuthor.USER).slice(-3).map(m => m.text).join('\n') || 'o tópico geral da matéria';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Com base no conhecimento do tutor de ${tutor.subject} e no tópico recente de "${topic}", crie um quiz com 5 perguntas de múltipla escolha. Para cada pergunta, forneça o texto da pergunta, uma lista de 4 opções, a resposta correta e uma breve explicação do porquê a resposta está correta.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING },
                                    explanation: { type: Type.STRING }
                                },
                                required: ["question", "options", "correctAnswer", "explanation"]
                            }
                        }
                    },
                    required: ["quiz"]
                }
            }
        });

        const quizData = JSON.parse(response.text);
        if (quizData.quiz && quizData.quiz.length > 0) {
            setQuizQuestions(quizData.quiz);
            setCurrentView('quiz');
        } else {
            throw new Error("A resposta da IA não continha um quiz válido.");
        }

    } catch (error) {
        console.error("Erro ao gerar quiz:", error);
        setMessages(prev => [...prev.slice(0, -1), { author: MessageAuthor.MODEL, text: "Desculpe, não consegui gerar o quiz. Tente novamente."}]);
    } finally {
        setIsLoading(false);
    }
}, [chat, isLoading, tutor.subject, messages]);


const handleGenerateFlashcards = useCallback(async () => {
    if (!chat || isLoading) return;
    setIsToolsMenuOpen(false);
    setIsLoading(true);
    setMessages(prev => [...prev, { author: MessageAuthor.MODEL, text: "Certo! Gerando flashcards para revisão..."}]);

    try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const topic = messages.filter(m => m.author === MessageAuthor.USER).slice(-3).map(m => m.text).join('\n') || 'os conceitos chave da matéria';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Com base no conhecimento do tutor de ${tutor.subject} e no tópico recente de "${topic}", crie um conjunto de 10 flashcards. Cada flashcard deve ter uma pergunta (um conceito, termo ou problema) e uma resposta curta e direta.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        flashcards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer: { type: Type.STRING },
                                },
                                required: ["question", "answer"]
                            }
                        }
                    },
                    required: ["flashcards"]
                }
            }
        });

        const flashcardData = JSON.parse(response.text);
        if (flashcardData.flashcards && flashcardData.flashcards.length > 0) {
            setFlashcards(flashcardData.flashcards);
            setCurrentView('flashcards');
        } else {
            throw new Error("A resposta da IA não continha flashcards válidos.");
        }
    } catch (error) {
        console.error("Erro ao gerar flashcards:", error);
         setMessages(prev => [...prev.slice(0, -1), { author: MessageAuthor.MODEL, text: "Desculpe, não consegui gerar os flashcards. Tente novamente."}]);
    } finally {
        setIsLoading(false);
    }
}, [chat, isLoading, tutor.subject, messages]);


  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-slate-200">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-200/50">
                {ICONS.ARROW_LEFT}
            </button>
            <div>
                <h1 className="text-lg font-bold text-gray-800">{tutor.name}</h1>
                <p className="text-sm text-gray-500">{tutor.subject}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleClearChat}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-200/50"
                title="Limpar histórico e iniciar nova conversa"
            >
                {ICONS.RESTART}
            </button>
            <div className="relative" ref={toolsMenuRef}>
                {(tutor.tools?.quizGenerator || tutor.tools?.flashcardGenerator) && (
                    <button onClick={() => setIsToolsMenuOpen(prev => !prev)} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-200/50">
                        {ICONS.MORE_HORIZONTAL}
                    </button>
                )}
                {isToolsMenuOpen && (
                     <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 origin-top-right z-20">
                        <div className="py-1">
                            {tutor.tools?.quizGenerator && (
                                <button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                                    {ICONS.QUIZ}
                                    <span>Gerar Quiz</span>
                                </button>
                            )}
                            {tutor.tools?.flashcardGenerator && (
                                <button onClick={handleGenerateFlashcards} disabled={isLoading} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                                    {ICONS.FLASHCARD}
                                    <span>Gerar Flashcards</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <main className="absolute inset-0 overflow-y-auto p-4 pt-24 pb-28 space-y-4">
            {messages.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2.5 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                {msg.author === MessageAuthor.MODEL && (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        {ICONS.ROBOT}
                    </div>
                )}
                <div className={`max-w-md lg:max-w-2xl p-3 px-4 ${msg.author === MessageAuthor.USER ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl rounded-br-lg shadow-md' : 'bg-white/90 backdrop-blur-sm border border-slate-200/50 text-gray-800 rounded-3xl rounded-bl-lg shadow-sm'}`}>
                    {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
                    {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/70 pt-3">
                            <h4 className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fontes</h4>
                            <div className="flex flex-col gap-2">
                                {msg.sources.map((source, i) => (
                                <a 
                                    key={i} 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-sm text-indigo-700 hover:underline flex items-center gap-2 p-1 rounded-md hover:bg-indigo-50"
                                >
                                    <span className="flex-shrink-0 w-5 h-5 bg-slate-200 text-slate-600 text-xs flex items-center justify-center rounded-full font-semibold">{i + 1}</span>
                                    <span className="truncate" title={source.title}>{source.title || source.uri}</span>
                                </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {msg.author === MessageAuthor.USER && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        {ICONS.USER}
                    </div>
                )}
            </div>
            ))}
            {isLoading && (
            <div className="flex items-end gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    {ICONS.ROBOT}
                </div>
                <div className="max-w-md lg:max-w-2xl p-3 px-4 rounded-3xl rounded-bl-lg bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '75ms'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    </div>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </main>

        {currentView === 'quiz' && (
            <QuizView 
                questions={quizQuestions} 
                tutor={tutor} 
                onClose={() => setCurrentView('chat')} 
            />
        )}
        {currentView === 'flashcards' && (
            <FlashcardView 
                flashcards={flashcards} 
                tutorName={tutor.name}
                onClose={() => setCurrentView('chat')} 
            />
        )}
      </div>
      
      {currentView === 'chat' && (
          <footer className="fixed bottom-0 left-0 right-0 p-4 bg-transparent">
            <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-6 py-3 border border-gray-300/50 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-lg bg-white/80 backdrop-blur-sm transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 text-white p-3.5 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:scale-110 active:scale-100"
              >
                {isLoading ? ICONS.SPINNER : ICONS.SEND}
              </button>
            </form>
          </footer>
      )}
    </div>
  );
};

export default ChatInterface;