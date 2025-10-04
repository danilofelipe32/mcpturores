import React from 'react';
import { Tutor } from '../types';
import TutorCard from './TutorCard';
import { ICONS } from '../constants';

interface DashboardProps {
  tutors: Tutor[];
  onOpenModal: () => void;
  onSelectTutor: (tutor: Tutor) => void;
  onDeleteTutor: (tutorId: string) => void;
  onEditTutor: (tutor: Tutor) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tutors, onOpenModal, onSelectTutor, onDeleteTutor, onEditTutor }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Seus Tutores de IA</h1>
            <p className="text-slate-500 mt-1">Crie, gerencie e converse com seus agentes de tutoria.</p>
          </div>
          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200"
          >
            {ICONS.PLUS}
            <span>Criar Tutor</span>
          </button>
        </div>
      </header>

      <main>
        {tutors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map(tutor => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                onSelect={onSelectTutor}
                onDelete={onDeleteTutor}
                onEdit={onEditTutor}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-white rounded-xl border border-gray-200 mt-10">
            <div className="flex justify-center items-center mb-4">
                {ICONS.SPARKLES}
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Comece a criar!</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">Você ainda não tem tutores. Clique em "Criar Tutor" para configurar seu primeiro agente de IA e dar vida ao aprendizado.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;