import React, { useState, useEffect } from 'react';
import { Cpu, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { knowledgeApiService } from '../api';

// Level thresholds based on total engagement (views + likes*2 + follows*5)
const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, title: 'Newcomer' },
  { level: 2, min: 50, title: 'Contributor' },
  { level: 3, min: 200, title: 'Active' },
  { level: 4, min: 500, title: 'Established' },
  { level: 5, min: 1000, title: 'Influencer' },
  { level: 6, min: 2500, title: 'Expert' },
  { level: 7, min: 5000, title: 'Authority' },
  { level: 8, min: 10000, title: 'Master' },
  { level: 9, min: 25000, title: 'Legend' },
  { level: 10, min: 50000, title: 'Icon' },
];

const calculateLevel = (stats) => {
  const engagement = (stats.views || 0) + (stats.likes || 0) * 2 + (stats.follows || 0) * 5;
  let currentLevel = LEVEL_THRESHOLDS[0];
  
  for (const threshold of LEVEL_THRESHOLDS) {
    if (engagement >= threshold.min) {
      currentLevel = threshold;
    } else {
      break;
    }
  }
  
  // Calculate progress to next level
  const nextLevel = LEVEL_THRESHOLDS.find(t => t.min > engagement);
  const progress = nextLevel 
    ? Math.round(((engagement - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;
  
  return { ...currentLevel, engagement, progress, nextLevel };
};

export const Widgets = ({ userId }) => {
  const [trendingQuestions, setTrendingQuestions] = useState([]);
  const [userStats, setUserStats] = useState({ views: 0, likes: 0, follows: 0, growth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trending, stats] = await Promise.all([
          knowledgeApiService.getTrendingQuestions(7),
          userId ? knowledgeApiService.getUserStatsWithGrowth(userId) : { views: 0, likes: 0, follows: 0, growth: 0 }
        ]);
        setTrendingQuestions(trending);
        setUserStats(stats);
      } catch (err) {
        console.error('Error fetching widgets data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const levelInfo = calculateLevel(userStats);

  // Format view counts
  const formatCount = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      {/* ── Creator Panel ── */}
      <div className="bg-[#0f0f0f] border border-[rgba(200,30,30,0.22)] rounded-2xl p-4 relative overflow-hidden shadow-[0_0_26px_rgba(200,30,30,0.08)]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#c81e1e]" />
            <span className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.08em] text-white/70">
              Creator · Lvl {levelInfo.level}
            </span>
          </div>
          {userStats.growth !== 0 && (
            <span className={`font-[JetBrains_Mono,monospace] text-[9px] px-1.5 py-0.5 rounded-full ${
              userStats.growth > 0
                ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-900/30'
                : 'text-[#c81e1e] bg-[rgba(200,30,30,0.1)] border border-[rgba(200,30,30,0.2)]'
            }`}>
              {userStats.growth > 0 ? '+' : ''}{userStats.growth}%
            </span>
          )}
        </div>

        {levelInfo.nextLevel && (
          <div className="mb-3">
            <div className="flex justify-between font-[JetBrains_Mono,monospace] text-[8px] text-white/25 mb-1">
              <span>{levelInfo.title}</span>
              <span>{levelInfo.progress}% to Lvl {levelInfo.nextLevel.level}</span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c81e1e] to-[#e02424] transition-all duration-500"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: 'Views',   val: userStats.views },
            { label: 'Likes',   val: userStats.likes },
            { label: 'Follows', val: userStats.follows },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] p-1.5 text-center rounded-xl">
              <div className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-wider text-white/25">{label}</div>
              <div className="font-[Hanken_Grotesk,sans-serif] text-[11px] font-semibold text-white/80 mt-0.5">{formatCount(val)}</div>
            </div>
          ))}
        </div>

        <Link href="/profile?tab=dashboard"
          className="w-full bg-[rgba(200,30,30,0.1)] hover:bg-[rgba(200,30,30,0.18)] text-[#c81e1e] border border-[rgba(200,30,30,0.22)] font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.08em] py-2 rounded-xl transition-all block text-center"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* ── Trending Questions ── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/50 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[#c81e1e]" /> Trending
          </h3>
          <span className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-wider text-white/20">Real-time</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            <div className="py-5 flex justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white/[0.08] border-t-[#c81e1e] animate-spin" />
            </div>
          ) : trendingQuestions.length > 0 ? (
            trendingQuestions.map((question, index) => (
              <Link
                key={question.id}
                href={`/knowledge/question/${question.id}`}
                className="px-3 py-2.5 hover:bg-white/[0.03] flex gap-2.5 group block"
              >
                <div className={`font-[JetBrains_Mono,monospace] text-[10px] font-bold w-4 shrink-0 mt-0.5 ${
                  index < 3 ? 'text-[#c81e1e]' : 'text-white/20'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white/60 truncate group-hover:text-[#c81e1e] transition-colors font-[Hanken_Grotesk,sans-serif]">
                    {question.title}
                  </div>
                  <div className="font-[JetBrains_Mono,monospace] text-[8px] text-white/20 flex gap-2 mt-0.5">
                    <span>{formatCount(question.view_count)} views</span>
                    {question.topic?.name && (
                      <span className="text-white/25 bg-white/[0.04] px-1.5 rounded-full">{question.topic.name}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="py-5 text-center font-[Hanken_Grotesk,sans-serif] text-[11px] text-white/20">
              No trending questions yet
            </div>
          )}
        </div>
      </div>

      {/* ── Discover Tags ── */}
      <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-3">
        <h3 className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/30 mb-2.5">
          Discover
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {['Marxist Theory', 'Economics', 'History', 'Philosophy', 'Politics', 'Science', 'Technology', 'Ethics'].map(tag => (
            <span
              key={tag}
              className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider bg-white/[0.04] hover:bg-[rgba(200,30,30,0.08)] hover:border-[rgba(200,30,30,0.2)] hover:text-[#c81e1e] text-white/30 px-2.5 py-1 rounded-full cursor-pointer border border-white/[0.06] transition-all"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-wider text-white/15 px-1 leading-loose">
        <span className="mr-3">Guidelines</span>
        <span className="mr-3">Privacy</span>
        <span className="mr-3">Terms</span>
        <br />
        <span>© 2026 Marxist Platform</span>
      </div>
    </>
  );
};
