import React, { useState, useEffect, useRef } from 'react';
import { Tutor } from '../types';
import { ICONS, SCHOOL_SUBJECTS, PERSONA_EXAMPLES } from '../constants';
import { GoogleGenAI } from '@google/genai';


// Declara as variáveis globais carregadas pelos scripts em index.html
declare var mammoth: any;
declare var pdfjsLib: any;

const GEMINI_API_KEY = "AIzaSyB_FQvyfvHCpzyr8rJWUZxPvwKN5BQnQa8";


interface CreateTutorModalProps {
  onClose: () => void;
  onSave: (tutorData: Omit<Tutor, 'id' | 'createdAt'>) => void;
  existingTutor: Tutor | null;
}

interface UploadedFile {
    id: string;
    name: string;
    content: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const CreateTutorModal: React.FC<CreateTutorModalProps> = ({ onClose, onSave, existingTutor }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [persona, setPersona] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tools, setTools] = useState({
    // webSearch foi removido daqui e será controlado pela presença de webSources
    quizGenerator: false,
    conceptExplainer: false,
    scenarioSimulator: false,
    adaptiveLearning: false,
    flashcardGenerator: false,
    selfReflection: false,
    chainOfThought: false,
    treeOfThoughts: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para RAG da Web
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ uri: string; title: string }[]>([]);
  const [addedWebSources, setAddedWebSources] = useState<{ uri: string; title: string }[]>([]);

  const isEditing = !!existingTutor;

  useEffect(() => {
    if (existingTutor) {
      setName(existingTutor.name);
      setSubject(existingTutor.subject);
      setPersona(existingTutor.persona);
      if (existingTutor.knowledge) {
          setFiles([{ 
              id: 'existing_knowledge', 
              name: 'Base de conhecimento existente', 
              content: existingTutor.knowledge 
          }]);
      }
      setAddedWebSources(existingTutor.webSources || []);
      setTools({
          // Não definimos webSearch aqui, pois é implícito
          quizGenerator: existingTutor.tools?.quizGenerator || false,
          conceptExplainer: existingTutor.tools?.conceptExplainer || false,
          scenarioSimulator: existingTutor.tools?.scenarioSimulator || false,
          adaptiveLearning: existingTutor.tools?.adaptiveLearning || false,
          flashcardGenerator: existingTutor.tools?.flashcardGenerator || false,
          selfReflection: existingTutor.tools?.selfReflection || false,
          chainOfThought: existingTutor.tools?.chainOfThought || false,
          treeOfThoughts: existingTutor.tools?.treeOfThoughts || false,
      })
    }
  }, [existingTutor]);
  
  const processFile = async (file: File): Promise<UploadedFile | null> => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`O arquivo "${file.name}" é muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). O tamanho máximo permitido é de ${MAX_FILE_SIZE_MB} MB.`);
        return null;
    }

    try {
        let text = '';
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'txt' || extension === 'md') {
            text = await file.text();
        } else if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageTexts = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                pageTexts.push(pageText);
            }
            text = pageTexts.join('\n\n');
        } else if (extension === 'docx') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else {
            alert(`Tipo de arquivo não suportado: "${file.name}". Por favor, carregue .txt, .md, .pdf, ou .docx`);
            return null;
        }
        
        return { id: `file_${Date.now()}_${Math.random()}`, name: file.name, content: text };
    } catch (error) {
        console.error(`Erro ao processar o arquivo "${file.name}":`, error);
        alert(`Ocorreu um erro ao processar o arquivo "${file.name}". Ele pode estar corrompido ou em um formato inválido.`);
        return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessing(true);
    
    const processingPromises = Array.from(selectedFiles).map(processFile);
    const newFiles = await Promise.all(processingPromises);
    const validFiles = newFiles.filter((file): file is UploadedFile => file !== null);

    setFiles(prev => [...prev, ...validFiles]);

    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (idToRemove: string) => {
    setFiles(prev => prev.filter(file => file.id !== idToRemove));
  };

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("Chave de API do Gemini não encontrada.");
        }
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Encontre artigos e fontes confiáveis sobre: "${searchQuery}"`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks
            ?.map((chunk: any) => chunk.web)
            .filter((web: any) => web && web.uri && web.title);

        if (sources && sources.length > 0) {
            setSearchResults(sources);
        } else {
            alert("Nenhum resultado encontrado. Tente refinar sua busca.");
        }
    } catch (error) {
        console.error("Erro na busca da web:", error);
        alert("Ocorreu um erro ao realizar a busca na web.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleAddSource = (source: { uri: string; title: string }) => {
      if (addedWebSources.some(s => s.uri === source.uri)) {
          return; // Silenciosamente ignora se já foi adicionado.
      }
      try {
          // Valida se o URI é uma URL bem formada. Lançará um erro para URLs inválidas.
          new URL(source.uri);
          setAddedWebSources(prev => [...prev, source]);
      } catch (e) {
          console.error("Tentativa de adicionar URL inválida:", source.uri);
          alert(`O link da fonte "${source.title}" é inválido e não pode ser adicionado.`);
      }
  };

  const handleRemoveSource = (uriToRemove: string) => {
      setAddedWebSources(prev => prev.filter(s => s.uri !== uriToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !persona) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
     if (isProcessing) {
        alert('Por favor, aguarde o processamento dos arquivos terminar.');
        return;
    }
    const knowledge = files.map(file => 
      `Conteúdo do arquivo: ${file.name}\n\n${file.content}`
    ).join('\n\n---\n\n');
    
    // Inicia com as ferramentas manuais e adiciona a busca na web condicionalmente
    const finalTools = { 
        ...tools,
        webSearch: addedWebSources.length > 0
    };

    onSave({ name, subject, persona, knowledge, tools: finalTools, webSources: addedWebSources });
  };
  
  const handleToolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setTools(prev => ({ ...prev, [name]: checked }));
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl transform transition-all my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Tutor' : 'Criar Novo Agente Tutor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            {ICONS.CLOSE}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="tutor-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Tutor
              </label>
              <input
                type="text"
                id="tutor-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Assistente de Álgebra I"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Matéria
              </label>
              <select
                id="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required
              >
                <option value="" disabled>Selecione uma matéria</option>
                {SCHOOL_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="persona" className="block text-sm font-medium text-gray-700">
                  Persona (Instruções do Sistema)
                </label>
                <button
                  type="button"
                  onClick={() => setShowExamples(!showExamples)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  aria-expanded={showExamples}
                >
                  {showExamples ? 'Ocultar Exemplos' : 'Mostrar Exemplos'}
                </button>
              </div>
               {showExamples && (
                 <div className="bg-gray-100 p-4 rounded-lg my-2 border border-gray-200">
                   <h3 className="text-base font-semibold text-gray-800 mb-3">Exemplos de personas eficazes:</h3>
                   <div className="space-y-3">
                     {PERSONA_EXAMPLES.map((example, index) => (
                       <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition-shadow hover:shadow-md">
                           <h4 className="font-bold text-gray-900">{example.title}</h4>
                           <p className="mt-1 text-gray-600">{example.description}</p>
                           <button
                               type="button"
                               onClick={() => setPersona(example.description)}
                               className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-3"
                           >
                               Usar este exemplo
                           </button>
                       </div>
                     ))}
                   </div>
                 </div>
              )}
              <textarea
                id="persona"
                value={persona}
                onChange={e => setPersona(e.target.value)}
                rows={6}
                placeholder="Descreva a personalidade e as regras do tutor. Ex: 'Você é um tutor de matemática amigável e encorajador para alunos do 9º ano. Explique os conceitos passo a passo e nunca dê a resposta direta.'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              ></textarea>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Ferramentas e Capacidades</h3>
                <p className="mt-1 text-sm text-gray-600">Melhore seu tutor com capacidades adicionais. A busca na web será ativada automaticamente se você adicionar fontes da web abaixo.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="quizGenerator" name="quizGenerator" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.quizGenerator} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="quizGenerator" className="font-medium text-gray-700">Gerador de Quiz</label>
                            <p className="text-gray-500">Permite que o tutor crie quizzes para testar o conhecimento do aluno.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="flashcardGenerator" name="flashcardGenerator" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.flashcardGenerator} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="flashcardGenerator" className="font-medium text-gray-700">Gerador de Flashcards</label>
                            <p className="text-gray-500">Cria flashcards para ajudar na revisão de conceitos chave.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="conceptExplainer" name="conceptExplainer" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.conceptExplainer} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="conceptExplainer" className="font-medium text-gray-700">Explicador de Conceitos</label>
                            <p className="text-gray-500">Divide tópicos complexos em explicações simples e com analogias.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="scenarioSimulator" name="scenarioSimulator" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.scenarioSimulator} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="scenarioSimulator" className="font-medium text-gray-700">Simulador de Cenários</label>
                            <p className="text-gray-500">Cria cenários de role-playing interativos para praticar habilidades.</p>
                        </div>
                    </div>
                     <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="adaptiveLearning" name="adaptiveLearning" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.adaptiveLearning} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="adaptiveLearning" className="font-medium text-gray-700">Aprendizagem Adaptativa</label>
                            <p className="text-gray-500">Ajusta a dificuldade do conteúdo com base no progresso do aluno.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="selfReflection" name="selfReflection" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.selfReflection} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="selfReflection" className="font-medium text-gray-700">Prompts de Autorreflexão</label>
                            <p className="text-gray-500">Incentiva o aluno a refletir sobre seu aprendizado e compreensão.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="chainOfThought" name="chainOfThought" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.chainOfThought} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="chainOfThought" className="font-medium text-gray-700">Cadeia de Pensamento (CoT)</label>
                            <p className="text-gray-500">Instrui o tutor a explicar seu raciocínio passo a passo.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="treeOfThoughts" name="treeOfThoughts" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.treeOfThoughts} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="treeOfThoughts" className="font-medium text-gray-700">Árvore de Pensamentos (ToT)</label>
                            <p className="text-gray-500">Permite que o tutor explore e apresente múltiplas soluções para um problema.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Base de Conhecimento (RAG)</h3>
                    <p className="mt-1 text-sm text-gray-600">Forneça ao seu tutor conhecimento específico a partir de arquivos ou fontes da web.</p>
                </div>
                
                {/* RAG de Arquivos */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adicionar de Arquivos
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {ICONS.UPLOAD}
                            <div className="flex text-sm text-gray-600">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                >
                                    <span>Carregar arquivos</span>
                                    <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.md,.pdf,.docx" multiple />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500">Arquivos .txt, .md, .pdf, .docx (Máx {MAX_FILE_SIZE_MB}MB)</p>
                        </div>
                    </div>
                    {isProcessing && (
                        <div className="mt-4 text-center">
                            <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-2"> {ICONS.SPINNER} Processando arquivos...</p>
                        </div>
                    )}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-medium text-sm text-gray-600">Arquivos Carregados:</h4>
                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                {files.map((file) => (
                                    <li key={file.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                        <div className="w-0 flex-1 flex items-center">
                                            <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <button type="button" onClick={() => handleRemoveFile(file.id)} className="font-medium text-red-600 hover:text-red-500" aria-label={`Remover ${file.name}`}>
                                                {ICONS.TRASH}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* RAG da Web */}
                <div>
                     <label htmlFor="web-search" className="block text-sm font-medium text-gray-700 mb-1">
                        Adicionar da Web
                    </label>
                    <div className="flex items-center gap-2">
                         <input
                            type="text"
                            id="web-search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Pesquise por um tópico..."
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleWebSearch(); }}}
                        />
                        <button type="button" onClick={handleWebSearch} disabled={isSearching} className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2">
                            {isSearching ? ICONS.SPINNER : ICONS.WEB}
                            <span>{isSearching ? 'Buscando...' : 'Buscar'}</span>
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="font-medium text-sm text-gray-600">Resultados da Pesquisa:</h4>
                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                {searchResults.map((source) => {
                                    let hostname = source.uri;
                                    try {
                                        hostname = new URL(source.uri).hostname;
                                    } catch (e) {
                                        console.warn(`URL inválida encontrada: ${source.uri}`);
                                    }

                                    return (
                                        <li key={source.uri} className="pl-3 pr-4 py-3 flex items-start justify-between text-sm hover:bg-gray-50">
                                            <div className="w-0 flex-1 flex flex-col min-w-0">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium truncate" title={source.title}>
                                                    {source.title}
                                                </a>
                                                <span className="text-gray-500 text-xs mt-1 truncate">{hostname}</span>
                                            </div>
                                            <div className="ml-4 flex-shrink-0 self-center">
                                                <button type="button" onClick={() => handleAddSource(source)} disabled={addedWebSources.some(s => s.uri === source.uri)} className="font-medium text-sm text-green-600 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                                                    Adicionar
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    <div className="mt-6">
                        <h4 className="font-medium text-gray-800">Fontes da Web Adicionadas</h4>
                         {addedWebSources.length > 0 ? (
                            <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                                {addedWebSources.map((source) => (
                                    <li key={source.uri} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm bg-gray-50">
                                        <div className="w-0 flex-1 flex items-center">
                                            <span className="ml-2 flex-1 w-0 truncate text-gray-700" title={source.title}>{source.title}</span>
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <button type="button" onClick={() => handleRemoveSource(source.uri)} className="font-medium text-red-600 hover:text-red-500" aria-label={`Remover ${source.title}`}>
                                                {ICONS.TRASH}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-4 rounded-md border">Nenhuma fonte da web adicionada. Use a busca acima para encontrar e adicionar fontes.</p>
                        )}
                    </div>
                </div>

            </div>
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || isSearching}
              className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isProcessing || isSearching) && ICONS.SPINNER}
              {(isProcessing || isSearching) ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Criar Tutor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTutorModal;