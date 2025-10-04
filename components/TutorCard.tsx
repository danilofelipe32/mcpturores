import React, { useState } from 'react';
import { Tutor } from '../types';
import { ICONS, getSubjectColor } from '../constants';

interface TutorCardProps {
  tutor: Tutor;
  onSelect: (tutor: Tutor) => void;
  onDelete: (tutorId: string) => void;
  onEdit: (tutor: Tutor) => void;
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor, onSelect, onDelete, onEdit }) => {
  const { border, bg, text } = getSubjectColor(tutor.subject);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(tutor.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(tutor);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Codifica o objeto completo do tutor para ser passado na URL
      const tutorJson = JSON.stringify(tutor);
      const encodedTutorData = btoa(tutorJson);
      const shareUrl = `${window.location.origin}${window.location.pathname}?tutorData=${encodedTutorData}`;
      
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000); // Reseta após 2 segundos
      });
    } catch (error) {
      console.error("Erro ao criar link de compartilhamento:", error);
      alert("Não foi possível criar o link de compartilhamento.");
    }
  };

  const handleSelect = () => {
    onSelect(tutor);
  };

  return (
    <div 
      className={`relative group bg-white rounded-xl shadow-md border border-gray-200 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-t-4 ${border}`}
      onClick={handleSelect}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Ícones de Ação ao Passar o Mouse */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-transform hover:scale-110"
            aria-label="Copiar link de compartilhamento"
            title={linkCopied ? "Link Copiado!" : "Copiar link de compartilhamento"}
          >
            {ICONS.LINK}
          </button>
          <button
            onClick={handleEdit}
            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-transform hover:scale-110"
            aria-label="Editar tutor"
          >
            {ICONS.EDIT}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full bg-gray-100 text-red-500 hover:bg-red-100 transition-transform hover:scale-110"
            aria-label="Excluir tutor"
          >
            {ICONS.TRASH}
          </button>
        </div>

        {/* Conteúdo do Cartão */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 pr-16">{tutor.name}</h3>
          <span className={`text-xs font-semibold inline-block py-1 px-2.5 rounded-full mt-2 ${bg} ${text}`}>
            {tutor.subject}
          </span>
          <div className="mt-4 text-gray-600 text-sm h-20 overflow-hidden relative">
            <p>{tutor.persona}</p>
            {/* Efeito de fade para texto longo */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex justify-between items-center">
             <span className="text-sm font-semibold text-indigo-600 group-hover:underline">
                Conversar com o Tutor →
             </span>
             <div className="flex items-center gap-3 text-gray-400">
                {tutor.tools?.webSearch && (
                  <div title="Busca na Web Habilitada">
                    {ICONS.WEB}
                  </div>
                )}
                {tutor.tools?.quizGenerator && (
                  <div title="Gerador de Quiz Habilitado">
                    {ICONS.QUIZ}
                  </div>
                )}
                {tutor.tools?.conceptExplainer && (
                  <div title="Explicador de Conceitos Habilitado">
                    {ICONS.EXPLAIN}
                  </div>
                )}
                {tutor.tools?.scenarioSimulator && (
                  <div title="Simulador de Cenários Habilitado">
                    {ICONS.SIMULATE}
                  </div>
                )}
                {tutor.tools?.adaptiveLearning && (
                  <div title="Aprendizagem Adaptativa Habilitada">
                    {ICONS.ADAPTIVE}
                  </div>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default TutorCard;