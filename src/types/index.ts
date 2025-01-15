export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestResult {
  wpm: number;
  accuracy: number;
  totalWords: number;
  errors: number;
  timestamp: Date;
  name?: string;
}

export interface WordList {
  id: string;
  name: string;
  words: string[];
  difficulty: Difficulty;
}

export interface TestSettings {
  duration: number;
  difficulty: Difficulty;
  musicEnabled: boolean;
  darkMode: boolean;
}