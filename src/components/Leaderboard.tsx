import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Medal, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LeaderboardProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  username: string;
  wpm: number;
  accuracy: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          wpm,
          accuracy,
          profiles (username)
        `)
        .order('wpm', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedData = data.map((entry: any) => ({
        username: entry.profiles?.username || 'Anonymous',
        wpm: entry.wpm,
        accuracy: entry.accuracy,
      }));

      setEntries(formattedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {index < 3 && (
                    <Medal className={`w-6 h-6 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      'text-amber-600'
                    }`} />
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{entry.username}</p>
                  <p className="text-sm text-gray-500">{entry.wpm} WPM</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{entry.accuracy}%</p>
                  <p className="text-xs text-gray-500">Accuracy</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};