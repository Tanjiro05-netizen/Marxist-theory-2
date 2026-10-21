import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Clock, Zap, Trophy, ChevronRight } from 'lucide-react';
import { studyApiService } from '../api/study';

const DailyChallenge = ({ userId }) => {
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [challengeData, progressData] = await Promise.all([
          studyApiService.getTodaysChallenge(),
          userId ? studyApiService.getUserProgress(userId) : null
        ]);
        
        setChallenge(challengeData);
        setProgress(progressData);
        
        if (userId && challengeData) {
          const hasCompleted = await studyApiService.hasCompletedTodaysChallenge(userId);
          setCompleted(hasCompleted);
        }
      } catch (err) {
        console.error('Error fetching daily challenge:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Countdown timer to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const streakMultiplier = progress ? studyApiService.getStreakMultiplier(progress.current_streak) : 1.0;
  const dailyXp = progress?.daily_xp_earned || 0;
  const dailyCap = 100;
  const xpPercentage = Math.min((dailyXp / dailyCap) * 100, 100);

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  if (loading) {
    return (
      <div className="bg-[#10131b] border border-white/[0.06] rounded-none p-4 animate-pulse">
        <div className="h-3 bg-white/[0.06] rounded w-1/2 mb-3"></div>
        <div className="h-3 bg-white/[0.06] rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-white/[0.06] rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#10131b] border border-[rgba(179, 18, 46,0.22)] rounded-none overflow-hidden">
      {/* Header */}
      <div className="bg-[rgba(179, 18, 46,0.1)] border-b border-[rgba(179, 18, 46,0.18)] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#b3122e]" />
          <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-[#b3122e]">
            Daily Dialectic
          </span>
        </div>
        {progress?.current_streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3 h-3" />
            <span className="font-[JetBrains_Mono,monospace] text-[10px] font-bold">{progress.current_streak}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Topic */}
        <div>
          <div className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.12em] text-white/25 mb-1">
            {getDayName()}
          </div>
          <div className="font-[Outfit,sans-serif] text-[13px] font-semibold text-white/85 leading-snug">
            {challenge?.title || 'No challenge today'}
          </div>
          {challenge?.description && (
            <p className="font-[Outfit,sans-serif] text-[11px] text-white/35 mt-1 line-clamp-2 leading-relaxed">
              {challenge.description}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/30 font-[JetBrains_Mono,monospace] text-[10px]">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining}</span>
          </div>
          {streakMultiplier > 1 && (
            <div className="flex items-center gap-1 bg-orange-900/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-800/30 font-[JetBrains_Mono,monospace] text-[9px] font-bold">
              {streakMultiplier}x
            </div>
          )}
        </div>

        {/* XP Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-[JetBrains_Mono,monospace] text-[8px] text-white/25">
            <span>Daily XP</span>
            <span>{dailyXp}/{dailyCap}</span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10131b] from-[#b3122e] to-orange-500 transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        {completed ? (
          <div className="flex items-center justify-center gap-2 bg-emerald-900/20 text-emerald-400 border border-emerald-800/30 py-2 rounded-none font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            Completed Today
          </div>
        ) : (
          <Link href="/knowledge/study"
            className="flex items-center justify-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white py-2.5 rounded-none font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.08em] transition-all hover:shadow-[0_0_20px_rgba(179, 18, 46,0.3)] group"
          >
            <Zap className="w-3.5 h-3.5" />
            Start Challenge
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Rank footer */}
      {progress && (
        <div className="bg-white/[0.02] border-t border-white/[0.06] px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{studyApiService.getRankInfo(progress.current_rank).icon}</span>
            <span className="font-[Outfit,sans-serif] text-[11px] text-white/35 capitalize">{progress.current_rank}</span>
          </div>
          <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">{progress.total_xp} XP</span>
        </div>
      )}
    </div>
  );
};

export default DailyChallenge;
