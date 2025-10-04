import React from 'react';

export const ICONS = {
    PLUS: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
    TRASH: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    CHAT: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    EDIT: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
    CLOSE: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    SEND: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    ROBOT: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.5 9a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM12 8.5a.5.5 0 000 1h2a.5.5 0 000-1h-2zM6 12a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-4 3a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
    USER: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
    ARROW_LEFT: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
    SPINNER: <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>,
    UPLOAD: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    MORE_HORIZONTAL: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01" /></svg>,
    SPARKLES: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-9l2-2 2 2m-2-2v6m-2 4l2 2 2-2m-2 2v6" /></svg>,
    WEB: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9M3 12a9 9 0 019-9m-9 9a9 9 0 009 9m-9-9h18" /></svg>,
    QUIZ: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    EXPLAIN: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    SIMULATE: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    ADAPTIVE: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0112 3c1.398 0 2.743.34 3.957.957 2.486 2.014 2.986 5.014 2.986 7.014 2 1 2.657-1.343 2.657-1.343a8 8 0 01-4.943 9.043z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-2-4h4" /></svg>,
    LINK: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    DOCUMENT: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

export const SCHOOL_SUBJECTS = [
  'Artes',
  'Biologia',
  'Ciências',
  'Educação Física',
  'Filosofia',
  'Física',
  'Geografia',
  'História',
  'Língua Inglesa',
  'Língua Portuguesa',
  'Literatura',
  'Matemática',
  'Química',
  'Redação',
  'Sociologia',
];

export const PERSONA_EXAMPLES = [
    {
        title: 'Tutor Socrático de Matemática',
        description: 'Você é Sócrates, um tutor de matemática sábio e paciente. Em vez de dar respostas, você guia os alunos fazendo perguntas instigantes. Ajude-os a decompor problemas e descobrir a solução por conta própria.'
    },
    {
        title: 'Contador de Histórias de História',
        description: 'Você é um entusiasta da história que dá vida ao passado. Descreva eventos históricos com detalhes vívidos como se você estivesse lá, mencionando figuras-chave, datas e o significado.'
    },
    {
        title: 'Treinador de Escrita Criativa',
        description: 'Você é um treinador de escrita solidário. Seu objetivo é ajudar os alunos a superar o bloqueio de escritor. Forneça sugestões de histórias interessantes, ajude a desenvolver personagens e sugira frases alternativas. Nunca escreva a história para eles.'
    }
];

const subjectColorClasses = {
    'Artes': { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-800' },
    'Biologia': { border: 'border-green-400', bg: 'bg-green-100', text: 'text-green-800' },
    'Ciências': { border: 'border-teal-400', bg: 'bg-teal-100', text: 'text-teal-800' },
    'Educação Física': { border: 'border-orange-400', bg: 'bg-orange-100', text: 'text-orange-800' },
    'Filosofia': { border: 'border-indigo-400', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'Física': { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-800' },
    'Geografia': { border: 'border-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    'História': { border: 'border-amber-400', bg: 'bg-amber-100', text: 'text-amber-800' },
    'Língua Inglesa': { border: 'border-rose-400', bg: 'bg-rose-100', text: 'text-rose-800' },
    'Língua Portuguesa': { border: 'border-sky-400', bg: 'bg-sky-100', text: 'text-sky-800' },
    'Literatura': { border: 'border-violet-400', bg: 'bg-violet-100', text: 'text-violet-800' },
    'Matemática': { border: 'border-cyan-400', bg: 'bg-cyan-100', text: 'text-cyan-800' },
    'Química': { border: 'border-pink-400', bg: 'bg-pink-100', text: 'text-pink-800' },
    'Redação': { border: 'border-red-400', bg: 'bg-red-100', text: 'text-red-800' },
    'Sociologia': { border: 'border-fuchsia-400', bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
};

export const getSubjectColor = (subject: string) => {
    return subjectColorClasses[subject as keyof typeof subjectColorClasses] || { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-800' };
};