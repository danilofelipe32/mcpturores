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
      // 1. Carrega os tutores do localStorage como base inicial
      const storedTutors = localStorage.getItem('ai_tutors');
      let currentTutors: Tutor[] = storedTutors ? JSON.parse(storedTutors) : [];

      // Prioridade 1: Processar um link de compartilhamento com dados do tutor
      const urlParams = new URLSearchParams(window.location.search);
      const encodedTutorData = urlParams.get('tutorData');

      if (encodedTutorData) {
        const tutorJson = atob(encodedTutorData);
        const sharedTutor: Tutor = JSON.parse(tutorJson);

        // Adiciona ou atualiza o tutor na lista local
        if (!currentTutors.some(t => t.id === sharedTutor.id)) {
          currentTutors = [sharedTutor, ...currentTutors];
        }
        
        // Exibe o chat e atualiza a URL para o formato de link profundo
        setSelectedTutor(sharedTutor);
        setTutors(currentTutors);
        window.history.replaceState(null, '', `/#/chat/${sharedTutor.id}`);
        return; // Encerra o processamento para esta renderização
      }

      // Prioridade 2: Processar um link profundo a partir da hash da URL
      const hash = window.location.hash;
      if (hash.startsWith('#/chat/')) {
        const tutorId = hash.substring('#/chat/'.length);
        const foundTutor = currentTutors.find(t => t.id === tutorId);
        if (foundTutor) {
          setSelectedTutor(foundTutor);
          setTutors(currentTutors);
          return; // Encerra o processamento
        }
      }

      // Se nenhuma condição acima for atendida, exibe o painel
      setSelectedTutor(null);
      setTutors(currentTutors);

    } catch (error) {
      console.error("Falha ao carregar tutores ou processar URL", error);
      // Em caso de erro, limpa o estado e volta para o painel
      window.history.replaceState(null, '', window.location.pathname);
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
        tools: tutorData.tools || { webSearch: false, quizGenerator: false, conceptExplainer: false, scenarioSimulator: false, adaptiveLearning: false, flashcardGenerator: false },
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
    // Adiciona o estado de chat à URL para permitir links profundos
    history.pushState(null, '', `/#/chat/${tutor.id}`);
  }, []);

  const handleCloseChat = useCallback(() => {
    setSelectedTutor(null);
    // Limpa a hash da URL ao voltar para o painel
    history.pushState(null, '', window.location.pathname);
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