import { create } from 'zustand';
import { Activity } from '../lib/api/types';

export interface ActivityAnswer {
  correct: boolean;
  value?: unknown;
}

interface ActivitiesState {
  // UI filters for the activity list
  subjectFilter: string | null;
  setSubjectFilter: (subject: string | null) => void;

  // Active play session
  current: Activity | null;
  attemptId: string | null;
  answers: ActivityAnswer[];
  startedAt: number | null;
  startSession: (activity: Activity, attemptId: string) => void;
  recordAnswer: (answer: ActivityAnswer) => void;
  endSession: () => void;
  score: () => number;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  subjectFilter: null,
  setSubjectFilter: (subject) => set({ subjectFilter: subject }),

  current: null,
  attemptId: null,
  answers: [],
  startedAt: null,

  startSession: (activity, attemptId) =>
    set({ current: activity, attemptId, answers: [], startedAt: Date.now() }),

  recordAnswer: (answer) => set({ answers: [...get().answers, answer] }),

  endSession: () => set({ current: null, attemptId: null, answers: [], startedAt: null }),

  score: () => {
    const { answers } = get();
    if (answers.length === 0) return 0;
    const correct = answers.filter((a) => a.correct).length;
    return Math.round((correct / answers.length) * 100);
  },
}));
