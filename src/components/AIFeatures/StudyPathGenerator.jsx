import React, { useState, useCallback } from 'react';
import { 
  Sparkles, 
  Loader2, 
  BookOpen, 
  Clock, 
  Target, 
  ChevronRight,
  CheckCircle2,
  Lightbulb,
  Zap
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const INTERESTS = [
  { id: 'political_economy', label: 'Political Economy', icon: '📊' },
  { id: 'dialectical_materialism', label: 'Dialectical Materialism', icon: '🔄' },
  { id: 'historical_materialism', label: 'Historical Materialism', icon: '📜' },
  { id: 'scientific_socialism', label: 'Scientific Socialism', icon: '🔬' },
  { id: 'revolutionary_strategy', label: 'Revolutionary Strategy', icon: '⚔️' },
  { id: 'imperialism', label: 'Imperialism & Colonialism', icon: '🌍' },
  { id: 'cultural_revolution', label: 'Cultural & Ideological Work', icon: '🎭' },
  { id: 'party_building', label: 'Party Building', icon: '🏛️' },
];

const TIME_COMMITMENT = [
  { id: 'casual', label: 'Casual', desc: '1-2 hours/week', weeksMultiplier: 2 },
  { id: 'regular', label: 'Regular', desc: '3-5 hours/week', weeksMultiplier: 1 },
  { id: 'dedicated', label: 'Dedicated', desc: '6-10 hours/week', weeksMultiplier: 0.5 },
];

const StudyPathGenerator = ({ onPathGenerated, compact = false }) => {
  const [level, setLevel] = useState('beginner');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [timeCommitment, setTimeCommitment] = useState('regular');
  const [studyPath, setStudyPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generationTime, setGenerationTime] = useState(null);

  const toggleInterest = useCallback((interestId) => {
    setSelectedInterests(prev => 
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  }, []);

  const generatePath = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('study-path-generator', {
        body: {
          level,
          interests: selectedInterests.length > 0 
            ? selectedInterests 
            : INTERESTS.map(i => i.id),
          timeCommitment,
          language: 'english'
        }
      });

      if (invokeError) throw invokeError;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate study path');
      }

      // Adjust milestones based on time commitment
      const timeMultiplier = TIME_COMMITMENT.find(t => t.id === timeCommitment)?.weeksMultiplier || 1;
      const adjustedPath = {
        ...data.studyPath,
        milestones: data.studyPath.milestones.map(m => ({
          ...m,
          estimated_days: Math.round(m.estimated_days * timeMultiplier)
        }))
      };

      setStudyPath(adjustedPath);
      setGenerationTime(Date.now() - startTime);
      onPathGenerated?.(adjustedPath);
    } catch (err) {
      console.error('Study path generation error:', err);
      setError(err.message || 'Failed to generate study path. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [level, selectedInterests, timeCommitment, onPathGenerated]);

  const resetPath = useCallback(() => {
    setStudyPath(null);
    setError(null);
  }, []);

  // Compact mode for inline display
  if (compact && !studyPath) {
    return (
      <div className="bg-[#10131b] from-red-950/40 to-black/40 border border-red-900/30 rounded-none p-4">
        <div className="flexitems-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium text-white">Generate AI Study Path</span>
          </div>
          <button
            onClick={generatePath}
            disabled={loading}
            className="text-xs bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Generate
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Full mode with results
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/40 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-widest text-red-200">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-white">Personalized Study Path Generator</h2>
      <p className="text-sm text-zinc-400">
        Answer a few questions to receive a customized reading roadmap through Marxist theory.
      </p>

      {!studyPath ? (
        // Configuration Form
        <div className="space-y-6">
          {/* Level Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Target className="h-4 w-4 text-red-400" />
              Your Current Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`p-3 rounded-none border text-sm font-medium transition-all ${
                    level === lvl
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-black/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Commitment */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Clock className="h-4 w-4 text-red-400" />
              Weekly Time Commitment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_COMMITMENT.map((time) => (
                <button
                  key={time.id}
                  onClick={() => setTimeCommitment(time.id)}
                  className={`p-3 rounded-none border text-center transition-all ${
                    timeCommitment === time.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-black/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-sm font-medium">{time.label}</div>
                  <div className={`text-xs mt-0.5 ${timeCommitment === time.id ? 'text-red-200' : 'text-zinc-500'}`}>
                    {time.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <BookOpen className="h-4 w-4 text-red-400" />
              Areas of Interest (Optional)
            </label>
            <p className="text-xs text-zinc-500">
              Select topics you want to focus on, or leave blank for a general path.
            </p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    selectedInterests.includes(interest.id)
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-black/30 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className="mr-1.5">{interest.icon}</span>
                  {interest.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePath}
            disabled={loading}
            className="w-full bg-[#10131b] from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:from-zinc-700 disabled:to-zinc-600 text-white font-medium py-3 px-6 rounded-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating your personalized path...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate My Study Path
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-none bg-red-950/30 border border-red-900/50 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      ) : (
        // Generated Path Display
        <div className="space-y-6">
          {/* Path Header */}
          <div className="rounded-none border border-zinc-800 bg-[#10131b] from-zinc-900/80 to-black/60 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xl font-semibold text-white">{studyPath.path_title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{studyPath.description}</p>
              </div>
              <button
                onClick={resetPath}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Regenerate
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                ~{Math.round(studyPath.estimated_weeks * (TIME_COMMITMENT.find(t => t.id === timeCommitment)?.weeksMultiplier || 1))} weeks
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Target className="h-3.5 w-3.5" />
                {studyPath.milestones.length} milestones
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI-generated in {(generationTime / 1000).toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Milestones Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">
              Your Learning Journey
            </h4>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-[#10131b] from-red-600 via-zinc-700 to-zinc-800" />
              
              <div className="space-y-4">
                {studyPath.milestones.map((milestone, index) => (
                  <div key={index} className="relative flex gap-4 pl-10">
                    {/* Timeline Dot */}
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      index === 0 
                        ? 'bg-red-500 border-red-400 shadow-none shadow-red-500/30' 
                        : 'bg-zinc-900 border-zinc-600'
                    }`} />
                    
                    {/* Milestone Card */}
                    <div className="flex-1 bg-black/40 border border-zinc-800 rounded-none p-4 hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h5 className="font-medium text-white">
                          {index + 1}. {milestone.title}
                        </h5>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          milestone.difficulty === 'beginner' 
                            ? 'bg-green-900/40 text-green-300 border border-green-800'
                            : milestone.difficulty === 'intermediate'
                            ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-800'
                            : 'bg-red-900/40 text-red-300 border border-red-800'
                        }`}>
                          {milestone.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-sm text-zinc-400 mb-3">{milestone.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{milestone.estimated_days} days
                        </div>
                        {milestone.recommended_resources?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {milestone.recommended_resources.slice(0, 2).join(', ')}
                            {milestone.recommended_resources.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                      
                      {milestone.key_concepts?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-800">
                          {milestone.key_concepts.slice(0, 4).map((concept, cIdx) => (
                            <span 
                              key={cIdx}
                              className="text-xs px-2 py-0.5 rounded bg-zinc-800/60 text-zinc-400"
                            >
                              {concept.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Study Tips */}
          {studyPath.study_tips?.length > 0 && (
            <div className="rounded-none border border-amber-900/30 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <h4 className="text-sm font-medium text-amber-200">Study Tips</h4>
              </div>
              <ul className="space-y-2">
                {studyPath.study_tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-amber-100/80">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={resetPath}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 px-4 rounded-none transition-colors text-sm"
            >
              Customize Again
            </button>
            <button
              onClick={() => onPathGenerated?.(studyPath)}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-none transition-colors text-sm flex items-center justify-center gap-2"
            >
              Save to My Progress
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPathGenerator;
