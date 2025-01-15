import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, Target, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserStatsProps {
  onClose: () => void;
  userId: string;
}

interface Stats {
  totalTests: number;
  averageWPM: number;
  averageAccuracy: number;
  bestWPM: number;
  totalTime: number;
}

export const UserStats: React.FC<UserStatsProps> = ({ onClose, userId }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (data.length > 0) {
        const totalTests = data.length;
        const averageWPM = Math.round(data.reduce((acc, curr) => acc + curr.wpm, 0) / totalTests);
        const averageAccuracy = Math.round(data.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests);
        const bestWPM = Math.max(...data.map(result => result.wpm));
        const totalTime = data.reduce((acc, curr) => acc + curr.duration, 0);

        setStats({
          totalTests,
          averageWPM,
          averageAccuracy,
          bestWPM,
          totalTime,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
          <h2 className="text-2xl font-bold">Your Stats</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className="text-sm font-medium">Best WPM</p>
              </div>
              <p className="text-2xl font-bold">{stats.bestWPM}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium">Avg. Accuracy</p>
              </div>
              <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <p className="text-sm font-medium">Total Tests</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalTests}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg bg-white/50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <p className="text-sm font-medium">Avg. WPM</p>
              </div>
              <p className="text-2xl font-bold">{stats.averageWPM}</p>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tests completed yet. Start typing to see your stats!
          </div>
        )}
      </div>
    </motion.div>
  );
};