import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { studyApiService } from '../api/study';
import { 
  ArrowLeft, BookOpen, Clock, Target, Flame, ChevronRight,
  Trophy, AlertTriangle, RefreshCw, Loader2, Star
} from 'lucide-react';

const ENDING_STYLES = {
  victory: {
    bg: 'from-green-900/50 to-gray-900',
    border: 'border-green-500/50',
    icon: '🏆',
    title: 'Revolutionary Victory!',
    color: 'text-green-400'
  },
  partial: {
    bg: 'from-yellow-900/50 to-gray-900',
    border: 'border-yellow-500/50',
    icon: '⚡',
    title: 'Partial Victory',
    color: 'text-yellow-400'
  },
  defeat: {
    bg: 'from-red-900/50 to-gray-900',
    border: 'border-red-500/50',
    icon: '💔',
    title: 'Defeat',
    color: 'text-red-400'
  }
};

const ScenarioPlayer = ({ scenario, onBack, onComplete }) => {
  const { user } = useAuth();
  const [fullScenario, setFullScenario] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [choicesMade, setChoicesMade] = useState([]);
  const [isEnding, setIsEnding] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => {
    loadScenario();
  }, [scenario.id]);

  const loadScenario = async () => {
    setLoading(true);
    try {
      const data = await studyApiService.getScenarioWithNodes(scenario.id);
      setFullScenario(data);
      
      // Check for existing progress
      if (user) {
        const progress = await studyApiService.getScenarioProgress(user.id, scenario.id);
        if (progress && progress.current_node_id && !progress.completed_at) {
          const node = data.nodes.find(n => n.id === progress.current_node_id);
          if (node) {
            setCurrentNode(node);
            setChoicesMade(progress.choices_made || []);
            setLoading(false);
            return;
          }
        }
      }
      
      // Start from beginning
      const startNode = data.nodes.find(n => n.is_start);
      if (startNode) {
        setCurrentNode(startNode);
        if (user) {
          await studyApiService.saveScenarioProgress(user.id, scenario.id, startNode.id, null);
        }
      }
    } catch (err) {
      console.error('Error loading scenario:', err);
    }
    setLoading(false);
  };

  const handleChoice = async (choice) => {
    if (!choice.next_node_id || !fullScenario) return;
    
    const nextNode = fullScenario.nodes.find(n => n.id === choice.next_node_id);
    if (!nextNode) return;

    const newChoicesMade = [...choicesMade, choice.id];
    setChoicesMade(newChoicesMade);
    setCurrentNode(nextNode);

    // Check if this is an ending
    if (nextNode.node_type === 'ending') {
      setIsEnding(true);
      const bonusXp = choice.is_historically_accurate ? 10 : 0;
      const totalXp = scenario.xp_reward + bonusXp;
      setXpEarned(totalXp);
      
      if (user) {
        await studyApiService.saveScenarioProgress(
          user.id, 
          scenario.id, 
          nextNode.id, 
          choice.id, 
          true, 
          nextNode.ending_type,
          totalXp
        );
        
        // Award XP
        const progress = await studyApiService.getUserProgress(user.id);
        if (progress) {
          await studyApiService.updateUserProgress(user.id, {
            total_xp: (progress.total_xp || 0) + totalXp,
            daily_xp: Math.min((progress.daily_xp || 0) + totalXp, 100)
          });
        }
      }
    } else {
      if (user) {
        await studyApiService.saveScenarioProgress(
          user.id, 
          scenario.id, 
          nextNode.id, 
          choice.id
        );
      }
    }
  };

  const handleRestart = async () => {
    setIsEnding(false);
    setChoicesMade([]);
    setXpEarned(0);
    
    const startNode = fullScenario?.nodes.find(n => n.is_start);
    if (startNode) {
      setCurrentNode(startNode);
      if (user) {
        // Reset progress
        await studyApiService.saveScenarioProgress(user.id, scenario.id, startNode.id, null, false, null, 0);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#b3122e]" />
      </div>
    );
  }

  if (!fullScenario || !currentNode) {
    return (
      <div className="text-center py-20 text-white/25">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
        <p className="text-sm">Scenario not found or has no content.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] rounded-none text-white/60 text-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const endingStyle = isEnding && currentNode.ending_type 
    ? ENDING_STYLES[currentNode.ending_type] 
    : null;

  return (
    <div className="max-w-3xl mx-auto font-[Outfit,sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-colors"
        >
          <ArrowLeft size={13} /> Exit Scenario
        </button>
        <div className="flex items-center gap-4 font-[JetBrains_Mono,monospace] text-[10px] text-white/20">
          <span className="flex items-center gap-1"><BookOpen size={11} />{fullScenario.setting || 'Historical Scenario'}</span>
          <span className="flex items-center gap-1 capitalize"><Target size={11} />{fullScenario.difficulty}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/20">Progress</span>
          <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20">{choicesMade.length} choices</span>
        </div>
        <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#b3122e] transition-all duration-500"
            style={{ width: `${Math.min((choicesMade.length / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Story Card */}
      <div className={`rounded-none overflow-hidden border ${
        endingStyle
          ? endingStyle.border === 'border-green-500/50'
            ? 'bg-emerald-900/10 border-emerald-800/30'
            : endingStyle.border === 'border-yellow-500/50'
              ? 'bg-yellow-900/10 border-yellow-800/30'
              : 'bg-[rgba(179, 18, 46,0.06)] border-[rgba(179, 18, 46,0.2)]'
          : 'bg-[#10131b] border-white/[0.07]'
      }`}>
        {/* Node Title */}
        {currentNode.title && (
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className={`font-[Cormorant_Garamond,Georgia,serif] text-[20px] font-[500] ${
              endingStyle?.color ||
              (endingStyle?.border === 'border-green-500/50' ? 'text-emerald-400' :
               endingStyle?.border === 'border-yellow-500/50' ? 'text-yellow-400' :
               endingStyle ? 'text-[#b3122e]' : 'text-white')
            }`}>
              {endingStyle ? `${endingStyle.icon} ${endingStyle.title}` : currentNode.title}
            </h2>
          </div>
        )}

        {/* Image */}
        {currentNode.image_url && (
          <div className="w-full h-48 bg-white/[0.03]">
            <img src={currentNode.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <p className="text-white/55 text-[14px] leading-relaxed whitespace-pre-wrap mb-6">
            {currentNode.content}
          </p>

          {/* Ending Insight */}
          {isEnding && currentNode.ending_insight && (
            <div className="p-4 bg-white/[0.03] rounded-none border border-white/[0.06] mb-4">
              <h4 className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/25 mb-2 flex items-center gap-2">
                <Star size={11} /> Historical Insight
              </h4>
              <p className="text-[13px] text-white/50">{currentNode.ending_insight}</p>
            </div>
          )}

          {/* XP Earned */}
          {isEnding && xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 text-orange-400/80 mb-4">
              <Flame size={16} />
              <span className="font-[JetBrains_Mono,monospace] text-[14px] font-bold">+{xpEarned} XP Earned!</span>
            </div>
          )}

          {/* Choices */}
          {!isEnding && currentNode.choices && currentNode.choices.length > 0 && (
            <div className="space-y-2.5">
              <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/25 mb-3">What do you do?</p>
              {currentNode.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice)}
                  className="w-full text-left p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-[rgba(179, 18, 46,0.3)] rounded-none transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center font-[JetBrains_Mono,monospace] text-[10px] font-bold text-white/30 group-hover:bg-[#b3122e] group-hover:text-white transition-colors">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex-1">
                      <p className="text-white/70 group-hover:text-white text-[13px] transition-colors">
                        {choice.choice_text}
                      </p>
                      {choice.consequence_preview && (
                        <p className="text-[11px] text-white/25 mt-1 italic">{choice.consequence_preview}</p>
                      )}
                    </div>
                    <ChevronRight size={15} className="text-white/20 group-hover:text-[#b3122e] transition-colors shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Ending Actions */}
          {isEnding && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-none text-white/50 text-[12px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-colors"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <button
                onClick={() => onComplete?.(xpEarned)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#b3122e] hover:bg-[#d41f3d] rounded-none text-white text-[12px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-colors"
              >
                <Trophy size={14} /> Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlayer;
