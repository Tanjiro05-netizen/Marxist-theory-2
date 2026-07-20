import React from 'react';
import { Flame, Users, TrendingUp } from 'lucide-react';
import { studyApiService } from '../api/study';

const ProgressHeader = ({ progress, userCell }) => {
  const rankInfo = studyApiService.getRankInfo(progress?.current_rank || 'noob');
  const nextRankXp = studyApiService.getXpForNextRank(progress?.current_rank || 'noob');
  const currentXp = progress?.total_xp || 0;
  const streakMultiplier = studyApiService.getStreakMultiplier(progress?.current_streak || 0);
  
  // Calculate progress to next rank
  const prevRankXp = {
    noob: 0,
    activist: 500,
    organizer: 1500,
    cadre: 3500,
    revolutionary: 7000,
    vanguard: 12000
  }[progress?.current_rank || 'noob'] || 0;
  
  const xpInCurrentRank = currentXp - prevRankXp;
  const xpNeededForNext = nextRankXp ? nextRankXp - prevRankXp : 0;
  const progressPercentage = nextRankXp 
    ? Math.min((xpInCurrentRank / xpNeededForNext) * 100, 100) 
    : 100;

  const rankBarColor = {
    gray: 'bg-white/20',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-[#c81e1e]',
    gold: 'bg-yellow-500',
  }[rankInfo.color] || 'bg-[#c81e1e]';

  const rankTextColor = {
    gray: 'text-white/40',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-[#c81e1e]',
    gold: 'text-yellow-400',
  }[rankInfo.color] || 'text-white/60';

  return (
    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-4 md:p-5 font-[Hanken_Grotesk,sans-serif]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Rank & XP */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center text-2xl shrink-0">
            {rankInfo.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-[0.12em] font-bold ${rankTextColor}`}>
              {rankInfo.label}
            </span>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${rankBarColor}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/30">{currentXp.toLocaleString()} XP</span>
                {nextRankXp && (
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">
                    {(nextRankXp - currentXp).toLocaleString()} to next rank
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 md:gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className={`w-4 h-4 ${(progress?.current_streak || 0) >= 7 ? 'text-orange-400' : 'text-white/20'}`} />
              <span className="text-[18px] font-bold text-white leading-none">{progress?.current_streak || 0}</span>
            </div>
            <div className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 uppercase tracking-wider mt-1">Streak</div>
            {streakMultiplier > 1 && (
              <div className="font-[JetBrains_Mono,monospace] text-[8px] text-orange-400 font-bold mt-0.5">{streakMultiplier}×</div>
            )}
          </div>

          <div className="w-px h-8 bg-white/[0.06]" />

          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-400/60" />
              <span className="text-[18px] font-bold text-white leading-none">{progress?.daily_xp_earned || 0}</span>
              <span className="text-[11px] text-white/20">/100</span>
            </div>
            <div className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 uppercase tracking-wider mt-1">Today</div>
          </div>

          {userCell && (
            <>
              <div className="w-px h-8 bg-white/[0.06] hidden md:block" />
              <div className="text-center hidden md:block">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4 text-white/20" />
                  <span className="text-[12px] font-medium text-white/60 truncate max-w-[90px]">{userCell.name}</span>
                </div>
                <div className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 uppercase tracking-wider mt-1">Cell</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressHeader;
