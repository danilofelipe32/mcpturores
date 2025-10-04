import React, { useState, useEffect, useRef } from 'react';
import { Tutor } from '../types';
import { ICONS, SCHOOL_SUBJECTS, PERSONA_EXAMPLES } from '../constants';

// Declara as variáveis globais carregadas pelos scripts em index.html
declare var mammoth: any;
declare var pdfjsLib: any;

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
    webSearch: false,
    quizGenerator: false,
    conceptExplainer: false,
    scenarioSimulator: false,
    adaptiveLearning: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTools({
          webSearch: existingTutor.tools?.webSearch || false,
          quizGenerator: existingTutor.tools?.quizGenerator || false,
          conceptExplainer: existingTutor.tools?.conceptExplainer || false,
          scenarioSimulator: existingTutor.tools?.scenarioSimulator || false,
          adaptiveLearning: existingTutor.tools?.adaptiveLearning || false,
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
    
    onSave({ name, subject, persona, knowledge, tools });
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
                <p className="mt-1 text-sm text-gray-600">Melhore seu tutor com capacidades adicionais.</p>
                <div className="mt-4 space-y-4">
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="adaptiveLearning" name="adaptiveLearning" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.adaptiveLearning} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="adaptiveLearning" className="font-medium text-gray-700">Habilitar Aprendizagem Adaptativa</label>
                            <p className="text-gray-500">Permite que o tutor avalie continuamente o progresso do aluno e ajuste a dificuldade do conteúdo para se adequar ao seu nível de conhecimento.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="webSearch" name="webSearch" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.webSearch} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="webSearch" className="font-medium text-gray-700">Habilitar Busca na Web</label>
                            <p className="text-gray-500">Permite que o tutor pesquise na internet para responder perguntas sobre eventos atuais ou informações não contidas na base de conhecimento. As fontes serão citadas.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="quizGenerator" name="quizGenerator" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.quizGenerator} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="quizGenerator" className="font-medium text-gray-700">Habilitar Gerador de Quiz</label>
                            <p className="text-gray-500">Permite que o tutor crie perguntas de múltipla escolha ou dissertativas para testar o conhecimento do aluno sobre um tópico.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="conceptExplainer" name="conceptExplainer" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.conceptExplainer} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="conceptExplainer" className="font-medium text-gray-700">Habilitar Explicador de Conceitos</label>
                            <p className="text-gray-500">Permite que o tutor divida tópicos complexos em explicações simples, usando analogias e exemplos fáceis de entender.</p>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="scenarioSimulator" name="scenarioSimulator" type="checkbox" className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" checked={tools.scenarioSimulator} onChange={handleToolChange} />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="scenarioSimulator" className="font-medium text-gray-700">Habilitar Simulador de Cenários</label>
                            <p className="text-gray-500">Permite que o tutor atue como um personagem (figura histórica, personagem de livro, etc.) para criar cenários de role-playing interativos.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base de Conhecimento (RAG)
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
                        <p className="text-sm font-semibold text-blue-600">Processando arquivos...</p>
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
              disabled={isProcessing}
              className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && ICONS.SPINNER}
              {isProcessing ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Criar Tutor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTutorModal;