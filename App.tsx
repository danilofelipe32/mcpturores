import React, { useState, useEffect, useCallback } from 'react';
import { Tutor } from './types';
import Dashboard from './components/Dashboard';
import CreateTutorModal from './components/CreateTutorModal';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tutorToEdit, setTutorToEdit] = useState<Tutor | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  useEffect(() => {
    try {
      const storedTutors = localStorage.getItem('ai_tutors');
      let currentTutors: Tutor[] = storedTutors ? JSON.parse(storedTutors) : [];

      // Verifica os dados do tutor compartilhado na URL
      const urlParams = new URLSearchParams(window.location.search);
      const encodedTutorData = urlParams.get('tutorData');

      if (encodedTutorData) {
        try {
          const tutorJson = atob(encodedTutorData); // Decodifica de Base64
          const sharedTutor: Tutor = JSON.parse(tutorJson);
          
          // Abre o chat com o tutor compartilhado
          setSelectedTutor(sharedTutor);

          // Adiciona o tutor à lista local se ele não existir
          if (!currentTutors.some(t => t.id === sharedTutor.id)) {
            // Adiciona o novo tutor no início da lista
            currentTutors = [sharedTutor, ...currentTutors];
          }

          // Limpa a URL para evitar reprocessamento ao recarregar
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (parseError) {
          console.error("Falha ao analisar os dados do tutor compartilhado da URL:", parseError);
          // Limpa a URL se os dados forem inválidos
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
      
      setTutors(currentTutors);

    } catch (error) {
      console.error("Falha ao carregar tutores ou processar URL", error);
    }
  }, []); // O array de dependências vazio garante que isso rode apenas uma vez na montagem


  useEffect(() => {
    try {
      localStorage.setItem('ai_tutors', JSON.stringify(tutors));
    } catch (error) {
      console.error("Falha ao salvar tutores no localStorage", error);
    }
  }, [tutors]);

  const handleOpenCreateModal = useCallback(() => {
    setTutorToEdit(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((tutor: Tutor) => {
    setTutorToEdit(tutor);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTutorToEdit(null);
  }, []);

  const handleSaveTutor = useCallback((tutorData: Omit<Tutor, 'id' | 'createdAt'>) => {
    if (tutorToEdit) {
      // Atualiza tutor existente
      setTutors(prev => prev.map(t =>
        t.id === tutorToEdit.id ? { ...t, ...tutorData } : t
      ));
    } else {
      // Cria novo tutor
      const newTutor: Tutor = {
        ...tutorData,
        id: `tutor_${Date.now()}`,
        createdAt: new Date().toISOString(),
        tools: tutorData.tools || { webSearch: false, quizGenerator: false, conceptExplainer: false, scenarioSimulator: false, adaptiveLearning: false },
      };
      setTutors(prev => [newTutor, ...prev]);
    }
    handleCloseModal();
  }, [tutorToEdit, handleCloseModal]);

  const handleDeleteTutor = useCallback((tutorId: string) => {
    if (window.confirm('Você tem certeza que deseja excluir este tutor?')) {
      setTutors(prev => prev.filter(tutor => tutor.id !== tutorId));
    }
  }, []);

  const handleSelectTutor = useCallback((tutor: Tutor) => {
    setSelectedTutor(tutor);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedTutor(null);
  }, []);

  return (
    <div className="bg-slate-100 min-h-screen text-gray-800">
      {selectedTutor ? (
        <ChatInterface tutor={selectedTutor} onClose={handleCloseChat} />
      ) : (
        <>
          <Dashboard
            tutors={tutors}
            onOpenModal={handleOpenCreateModal}
            onSelectTutor={handleSelectTutor}
            onDeleteTutor={handleDeleteTutor}
            onEditTutor={handleOpenEditModal}
          />
          {isModalOpen && (
            <CreateTutorModal
              onClose={handleCloseModal}
              onSave={handleSaveTutor}
              existingTutor={tutorToEdit}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;