import React, { useState } from 'react';
import { QuizQuestion, Tutor } from '../types';
import { ICONS } from '../constants';

interface QuizViewProps {
  questions: QuizQuestion[];
  tutor: Tutor;
  onClose: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, tutor, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (selectedOption: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (userAnswers.includes(null)) {
        if (!window.confirm("Você não respondeu todas as perguntas. Deseja finalizar mesmo assim?")) {
            return;
        }
    }
    setShowResults(true);
  };

  const score = userAnswers.reduce((acc, answer, index) => {
    return answer === questions[index].correctAnswer ? acc + 1 : acc;
  }, 0);

  const getOptionClasses = (option: string, question: QuizQuestion) => {
    const isSelected = userAnswers[currentQuestionIndex] === option;
    if (showResults) {
        if (option === question.correctAnswer) {
            return 'bg-green-100 border-green-500 text-green-800';
        }
        if (isSelected && option !== question.correctAnswer) {
            return 'bg-red-100 border-red-500 text-red-800';
        }
    }
    return isSelected
      ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-300'
      : 'bg-white hover:bg-gray-50 border-gray-300';
  };

  const renderQuiz = () => {
    const question = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <p className="text-sm font-semibold text-indigo-600">Pergunta {currentQuestionIndex + 1} de {questions.length}</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-800">{question.question}</h3>
                <div className="mt-6 space-y-4">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-4 ${getOptionClasses(option, question)}`}
                        >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className="flex-grow">{option}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
                 <button onClick={onClose} className="py-2 px-4 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    Sair do Quiz
                </button>
                {isLastQuestion ? (
                    <button onClick={handleSubmit} className="py-2 px-6 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors">
                        Finalizar Quiz
                    </button>
                ) : (
                    <button onClick={handleNext} disabled={userAnswers[currentQuestionIndex] === null} className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        Próxima Pergunta
                    </button>
                )}
            </div>
        </div>
    );
  };

  const renderResults = () => {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-3xl font-bold text-gray-800">Resultados do Quiz</h2>
                <p className="mt-4 text-lg text-gray-600">
                    Você acertou <span className="font-bold text-indigo-600">{score}</span> de <span className="font-bold text-indigo-600">{questions.length}</span> perguntas.
                </p>
                <div className="mt-4 text-5xl font-bold" style={{color: score/questions.length >= 0.7 ? '#16a34a' : score/questions.length >= 0.4 ? '#f59e0b' : '#dc2626' }}>
                    {((score / questions.length) * 100).toFixed(0)}%
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Revisão das Perguntas</h3>
                {questions.map((q, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                        <p className="font-bold text-gray-800">{index + 1}. {q.question}</p>
                        <p className={`mt-2 text-sm ${userAnswers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                            Sua resposta: <span className="font-semibold">{userAnswers[index] || "Não respondida"}</span>
                            {userAnswers[index] !== q.correctAnswer && <span className="ml-2 font-semibold text-green-700">(Correta: {q.correctAnswer})</span>}
                        </p>
                        {userAnswers[index] !== q.correctAnswer && q.explanation && (
                             <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                                <p className="text-sm text-gray-700"><span className="font-semibold">Explicação:</span> {q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-8 text-center">
                <button onClick={onClose} className="py-2 px-6 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                    Voltar para o Chat
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-slate-100 z-20 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto">
        {showResults ? renderResults() : renderQuiz()}
    </div>
  );
};

export default QuizView;