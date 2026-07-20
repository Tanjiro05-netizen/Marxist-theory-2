import React, { useState } from 'react';
import { Coins, Sparkles, Trophy, X } from 'lucide-react';
import { studyApiService } from '../api/study';

const CollectButton = ({ results, quiz, userId, onCollected, onClose }) => {
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [finalXp, setFinalXp] = useState(null);
  const [error, setError] = useState(null);

  const handleCollect = async () => {
    if (collecting || collected) return;
    
    setCollecting(true);
    setError(null);

    try {
      const { attempt, progress } = await studyApiService.submitQuizAttempt(
        userId,
        quiz.id,
        results.score,
        results.maxScore,
        results.answers,
        0 // Time taken (could track this better)
      );

      setFinalXp(attempt.xp_earned);
      setCollected(true);

      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      // Delay before calling onCollected to show animation
      setTimeout(() => {
        onCollected?.(attempt, progress);
      }, 1500);

    } catch (err) {
      console.error('Error collecting XP:', err);
      setError('Failed to collect XP. Please try again.');
      setCollecting(false);
    }
  };

  const percentage = results.percentage;
  const streakMultiplier = studyApiService.getStreakMultiplier(0); // Will be updated by backend

  const grade =
    percentage >= 80 ? { label: 'Excellent!', icon: '🏆' } :
    percentage >= 60 ? { label: 'Well Done!', icon: '⚡' } :
    percentage >= 40 ? { label: 'Good Effort!', icon: '📖' } :
                       { label: 'Keep Studying!', icon: '✊' };

  return (
    <div className="text-center space-y-5 font-[Hanken_Grotesk,sans-serif]">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors"
      >
        <X size={16} className="text-white/30" />
      </button>

      {/* Trophy / Grade */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <span className="text-4xl">{grade.icon}</span>
        <h2 className="font-[Cormorant_Garamond,Georgia,serif] text-[24px] font-[500] text-white">{grade.label}</h2>
        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/25">Quiz Complete</p>
      </div>

      {/* Score breakdown */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2.5 text-left">
        {[
          { label: 'Score', value: `${results.score}/${results.maxScore}` },
          { label: 'Accuracy', value: `${percentage}%` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-[12px]">
            <span className="text-white/30">{label}</span>
            <span className="text-white/70 font-medium">{value}</span>
          </div>
        ))}
        <div className="h-px bg-white/[0.06]" />
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/30">Base XP</span>
          <span className="text-orange-400/80 font-medium font-[JetBrains_Mono,monospace]">+{results.xpEarned}</span>
        </div>
      </div>

      {/* XP collect panel */}
      <div className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-500 ${
        collected
          ? 'bg-yellow-900/20 border-yellow-700/40'
          : 'bg-white/[0.03] border-white/[0.07]'
      }`}>
        {collected && (
          <>
            <Sparkles size={16} className="absolute top-2 left-4 text-yellow-400 animate-pulse" />
            <Sparkles size={14} className="absolute top-3 right-6 text-orange-400 animate-pulse" />
            <Sparkles size={14} className="absolute bottom-3 left-8 text-yellow-300 animate-pulse" />
          </>
        )}
        <div className="flex items-center justify-center gap-2">
          <Coins size={24} className={collected ? 'text-yellow-400' : 'text-white/20'} />
          <span className={`font-[JetBrains_Mono,monospace] text-[36px] font-black leading-none ${collected ? 'text-yellow-400' : 'text-white'}`}>
            +{finalXp ?? results.xpEarned}
          </span>
          <span className={`text-[16px] ${collected ? 'text-yellow-400' : 'text-white/30'}`}>XP</span>
        </div>
        {streakMultiplier > 1 && !collected && (
          <p className="font-[JetBrains_Mono,monospace] text-[9px] text-orange-400/70 mt-2 uppercase tracking-wider">
            Streak ×{streakMultiplier} bonus applied!
          </p>
        )}
      </div>

      {error && <p className="text-[#c81e1e] text-[12px]">{error}</p>}

      {/* Collect / Collected */}
      {!collected ? (
        <button
          onClick={handleCollect}
          disabled={collecting}
          className={`w-full py-3.5 rounded-xl font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-[0.1em] transition-all active:scale-[0.98] ${
            collecting
              ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 shadow-[0_0_20px_rgba(234,179,8,0.15)]'
          }`}
        >
          {collecting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              Collecting...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Coins size={14} /> Tap to Collect
            </span>
          )}
        </button>
      ) : (
        <div className="text-emerald-400 font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
          <Sparkles size={14} /> XP Collected!
        </div>
      )}

      {!collected && (
        <button onClick={onClose} className="text-white/20 hover:text-white/40 text-[11px] transition-colors">
          Skip for now
        </button>
      )}
    </div>
  );
};

export default CollectButton;
