import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Moon, Sun, Trophy, User, LogOut, Timer, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { toast } from 'sonner';
import { Auth } from './Auth';
import { supabase } from '../lib/supabase';
import { Difficulty, TestSettings, TestResult } from '../types';
import { wordLists } from '../data/words';
import { Leaderboard } from './Leaderboard';
import { UserStats } from './UserStats';

const TypingTest: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [personalBest, setPersonalBest] = useState(0);
  
  const [settings, setSettings] = useState<TestSettings>({
    duration: 60,
    difficulty: 'medium' as Difficulty,
    musicEnabled: false,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
  });

  const [isActive, setIsActive] = useState(false);
  const [currentWords, setCurrentWords] = useState<string[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<TestResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(settings.duration);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && startTime) {
      timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = settings.duration - elapsed;
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          endTest();
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, startTime, settings.duration]);

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const calculateWPM = (words: number, minutes: number) => {
    return Math.round(words / minutes);
  };

  const calculateAccuracy = (totalWords: number, errors: number) => {
    if (totalWords === 0) return 0;
    return Math.round(((totalWords - errors) / totalWords) * 100);
  };

  const startTest = () => {
    const words = wordLists[settings.difficulty];
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setCurrentWords(shuffled);
    setWordIndex(0);
    setErrors(0);
    setStartTime(Date.now());
    setTimeLeft(settings.duration);
    setIsActive(true);
    setResults(null);
    setInputValue('');
  };

  const stopTest = () => {
    if (window.confirm('Are you sure you want to stop the test?')) {
      endTest();
    }
  };

  const endTest = async () => {
    if (!startTime) return;
    
    const endTime = Date.now();
    const timeInMinutes = (endTime - startTime) / 60000;
    const totalWords = wordIndex;
    const wpm = calculateWPM(totalWords, timeInMinutes);
    const accuracy = calculateAccuracy(totalWords, errors);
    
    const result: TestResult = {
      wpm,
      accuracy,
      totalWords,
      errors,
      timestamp: new Date(),
    };

    setResults(result);
    setIsActive(false);
    setTimeLeft(settings.duration);

    if (user) {
      if (wpm > personalBest) {
        setShowConfetti(true);
        toast.success('New personal best!');
        setPersonalBest(wpm);
      }

      try {
        const validAccuracy = isNaN(accuracy) ? 0 : accuracy;
        
        await supabase.from('test_results').insert([{
          user_id: user.id,
          wpm,
          accuracy: validAccuracy,
          total_words: totalWords,
          errors,
          difficulty: settings.difficulty,
          duration: settings.duration
        }]);
      } catch (error) {
        console.error('Error saving results:', error);
        toast.error('Failed to save results');
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) return;
    
    const value = e.target.value;
    const lastChar = value[value.length - 1];
    
    if (lastChar === ' ') {
      const word = value.trim();
      if (word === currentWords[wordIndex]) {
        setWordIndex(prev => prev + 1);
      } else {
        setErrors(prev => prev + 1);
      }
      setInputValue('');
    } else {
      setInputValue(value);
    }
  };

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold">Typing Speed Test</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {settings.darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Trophy className="w-6 h-6" />
              </button>
              {user ? (
                <>
                  <button
                    onClick={() => setShowStats(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => supabase.auth.signOut()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {!isActive && !results && (
              <div className="text-center">
                <button
                  onClick={startTest}
                  className="px-6 py-3 text-lg rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  Start Test
                </button>
              </div>
            )}

            {isActive && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-medium flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5" />
                      <span className={timeLeft <= 10 ? 'text-red-500' : ''}>
                        {timeLeft}s
                      </span>
                    </div>
                    <div>Words: {wordIndex}</div>
                    <div>Errors: {errors}</div>
                  </div>
                  <button
                    onClick={stopTest}
                    className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                  <p className="text-lg mb-4 leading-relaxed">
                    {currentWords.slice(wordIndex, wordIndex + 10).join(' ')}
                  </p>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInput}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    placeholder="Type here..."
                    autoFocus
                  />
                </div>
              </div>
            )}

            {results && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Test Results</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">WPM</p>
                    <p className="text-2xl font-bold">{results.wpm}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
                    <p className="text-2xl font-bold">{results.accuracy}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Words</p>
                    <p className="text-2xl font-bold">{results.totalWords}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
                    <p className="text-2xl font-bold">{results.errors}</p>
                  </div>
                </div>
                <button
                  onClick={startTest}
                  className="mt-6 w-full px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAuth && <Auth onClose={() => setShowAuth(false)} />}
          {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
          {showStats && user && <UserStats onClose={() => setShowStats(false)} userId={user.id} />}
        </AnimatePresence>

        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
      </div>
    </div>
  );
};

export default TypingTest;