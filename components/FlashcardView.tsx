import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { ICONS } from '../constants';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  onClose: () => void;
  tutorName: string;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcards, onClose, tutorName }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false); // Reseta o estado de virar quando o card muda
  }, [currentCardIndex]);

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };
  
  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="absolute inset-0 bg-slate-100 z-20 flex flex-col p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Flashcards de {tutorName}</h2>
            <p className="text-slate-500">Revise os conceitos chave. Clique no card para virar.</p>
        </div>
        <button onClick={onClose} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
          {ICONS.CLOSE}
          <span>Fechar</span>
        </button>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Container do Card */}
        <div className="w-full max-w-2xl aspect-[16/9] [perspective:1000px]">
            <div 
                className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Frente do Card */}
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center p-8 text-center">
                    <p className="text-xl md:text-2xl font-semibold text-gray-800">{currentCard.question}</p>
                </div>
                {/* Verso do Card */}
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-indigo-500 text-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center p-8 text-center [transform:rotateY(180deg)]">
                     <p className="text-lg md:text-xl">{currentCard.answer}</p>
                </div>
            </div>
        </div>

        {/* Navegação */}
        <div className="mt-8 flex items-center justify-between w-full max-w-2xl">
            <button
                onClick={handlePrev}
                disabled={currentCardIndex === 0}
                className="py-2 px-5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Anterior
            </button>
            <span className="font-medium text-gray-600">
                {currentCardIndex + 1} / {flashcards.length}
            </span>
            <button
                onClick={handleNext}
                disabled={currentCardIndex === flashcards.length - 1}
                className="py-2 px-5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Próximo
            </button>
        </div>
      </div>
    </div>
  );
};
export default FlashcardView;
