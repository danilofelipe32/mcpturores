import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tutor, ChatMessage, MessageAuthor } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI, Chat } from '@google/genai';

interface ChatInterfaceProps {
  tutor: Tutor;
  onClose: () => void;
}

// Em um aplicativo real, NUNCA exponha sua chave de API no código do lado do cliente.
// Use variáveis de ambiente e um backend para proteger sua chave.
const GEMINI_API_KEY = "AIzaSyB_FQvyfvHCpzyr8rJWUZxPvwKN5BQnQa8";

const ChatInterface: React.FC<ChatInterfaceProps> = ({ tutor, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        author: MessageAuthor.MODEL,
        text: `Olá! Eu sou ${tutor.name}, seu tutor de ${tutor.subject}. Como posso te ajudar hoje?`
      }
    ]);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error("Chave de API do Gemini não encontrada.");
      }
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      let finalSystemInstruction = tutor.persona;
    
      if (tutor.tools?.adaptiveLearning) {
          finalSystemInstruction += "\n\nCAPACIDADE ADICIONAL: Você é um tutor adaptativo. Sua principal diretriz é avaliar continuamente o nível de compreensão do aluno com base em suas respostas. - Se o aluno demonstrar dificuldade ou cometer erros, você deve simplificar o conteúdo, usar analogias mais simples e dividir os problemas em etapas menores. - Se o aluno mostrar domínio e responder corretamente, você deve gradualmente aumentar a complexidade, introduzir tópicos relacionados e fazer perguntas mais desafiadoras. O objetivo é personalizar a experiência de aprendizado em tempo real para se adequar ao ritmo do aluno, mantendo-o engajado e desafiado na medida certa. Faça essa adaptação de forma natural na conversa.";
      }
      if (tutor.tools?.quizGenerator) {
          finalSystemInstruction += "\n\nCAPACIDADE ADICIONAL: Você também é um Gerador de Quiz. Se o aluno pedir um quiz, um teste, ou para ser testado, crie perguntas (múltipla escolha ou dissertativas) com base no seu conhecimento. Sempre forneça as respostas corretas e explicações depois que o aluno tentar responder.";
      }
      if (tutor.tools?.conceptExplainer) {
          finalSystemInstruction += "\n\nCAPACIDADE ADICIONAL: Você também é um Explicador de Conceitos. Se o aluno pedir para explicar um tópico complexo, divida-o em partes simples, use analogias e explique como se estivesse falando com um iniciante.";
      }
      if (tutor.tools?.scenarioSimulator) {
          finalSystemInstruction += "\n\nCAPACIDADE ADICIONAL: Você também é um Simulador de Cenários. Se o aluno pedir para iniciar uma simulação ou um role-play, você deve assumir o papel de um personagem (como uma figura histórica, um personagem de livro, etc.) e interagir com o aluno para ajudá-lo a praticar ou entender uma situação.";
      }
      
      const config: any = { systemInstruction: finalSystemInstruction };
      if (tutor.tools?.webSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: config
      });
      setChat(newChat);

    } catch (error) {
      console.error("Falha ao inicializar o chat do Gemini:", error);
      setMessages(prev => [...prev, {
        author: MessageAuthor.MODEL,
        text: "Desculpe, não consegui iniciar a sessão de chat. Verifique a configuração da API."
      }]);
    }

  }, [tutor]);

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
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      let promptWithContext = currentInput;

      if (tutor.knowledge && tutor.knowledge.trim().length > 0) {
        promptWithContext = `
Você é um assistente de tutoria. Sua tarefa é responder à pergunta do aluno usando APENAS as informações fornecidas no documento de contexto abaixo.

Analise o documento e encontre os trechos mais relevantes para a pergunta. Baseie sua resposta inteiramente nesses trechos.

Se a resposta não puder ser encontrada no documento, afirme claramente: "Não encontrei a resposta para isso no material de apoio." Não tente responder com conhecimento geral.

### CONTEXTO DO DOCUMENTO ###
${tutor.knowledge}
### FIM DO CONTEXTO ###

### PERGUNTA DO ALUNO ###
${currentInput}
### FIM DA PERGUNTA ###

Sua Resposta:
        `.trim();
      }

      const response = await chat.sendMessage({ message: promptWithContext });
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
  }, [input, isLoading, tutor, chat]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
          {ICONS.ARROW_LEFT}
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{tutor.name}</h1>
          <p className="text-sm text-gray-500">{tutor.subject}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
            {msg.author === MessageAuthor.MODEL && (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                {ICONS.ROBOT}
              </div>
            )}
            <div className={`max-w-md lg:max-w-2xl p-3 rounded-lg ${msg.author === MessageAuthor.USER ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
               {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 border-t border-gray-200/70 pt-3">
                  <h4 className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Fontes</h4>
                  <div className="flex flex-col gap-2">
                    {msg.sources.map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-2 p-1 rounded-md hover:bg-indigo-50"
                      >
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-200 text-gray-600 text-xs flex items-center justify-center rounded-full font-semibold">{i + 1}</span>
                        <span className="truncate" title={source.title}>{source.title || source.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
             {msg.author === MessageAuthor.USER && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                {ICONS.USER}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
           <div className="flex items-start gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                {ICONS.ROBOT}
              </div>
            <div className="max-w-md lg:max-w-2xl p-3 rounded-lg bg-white text-gray-800 shadow-sm">
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

      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? ICONS.SPINNER : ICONS.SEND}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatInterface;