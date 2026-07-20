import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { studyApiService } from '../api/study';
import { 
  Lock, CheckCircle, BookOpen, ChevronRight, 
  Loader2, Star, Zap, Info, X
} from 'lucide-react';

const MASTERY_LEVELS = {
  0: { label: 'Locked', color: 'gray', icon: Lock },
  1: { label: 'Learning', color: 'yellow', icon: BookOpen },
  2: { label: 'Practiced', color: 'blue', icon: Zap },
  3: { label: 'Mastered', color: 'green', icon: CheckCircle }
};

const CATEGORY_COLORS = {
  yellow: 'from-yellow-600 to-amber-700',
  orange: 'from-orange-600 to-red-700',
  purple: 'from-purple-600 to-indigo-700',
  red: 'from-red-600 to-rose-700',
  rose: 'from-rose-600 to-pink-700',
  blue: 'from-blue-600 to-cyan-700',
  green: 'from-green-600 to-emerald-700'
};

const MasteryTree = ({ onConceptSelect }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [userMastery, setUserMastery] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, conceptsData] = await Promise.all([
        studyApiService.getConceptCategories(),
        studyApiService.getConceptsWithPrerequisites()
      ]);
      
      setCategories(categoriesData);
      setConcepts(conceptsData);
      
      if (user) {
        const masteryData = await studyApiService.getUserConceptMastery(user.id);
        const masteryMap = {};
        masteryData.forEach(m => {
          masteryMap[m.concept_id] = m;
        });
        setUserMastery(masteryMap);
      }
      
      // Auto-expand first category
      if (categoriesData.length > 0) {
        setExpandedCategory(categoriesData[0].id);
      }
    } catch (err) {
      console.error('Error loading mastery tree:', err);
    }
    setLoading(false);
  };

  const getConceptMasteryLevel = (conceptId) => {
    return userMastery[conceptId]?.mastery_level || 0;
  };

  const isConceptUnlocked = (concept) => {
    if (!concept.prerequisite_ids || concept.prerequisite_ids.length === 0) {
      return true; // No prerequisites = always unlocked
    }
    
    // All prerequisites must be at least level 1
    return concept.prerequisite_ids.every(prereqId => {
      const prereqMastery = getConceptMasteryLevel(prereqId);
      return prereqMastery >= 1;
    });
  };

  const getConceptsByCategory = (categoryId) => {
    return concepts.filter(c => c.category_id === categoryId);
  };

  const getTotalMastered = (categoryId) => {
    const categoryConcepts = getConceptsByCategory(categoryId);
    return categoryConcepts.filter(c => getConceptMasteryLevel(c.id) >= 3).length;
  };

  const handleConceptClick = (concept) => {
    if (isConceptUnlocked(concept)) {
      setSelectedConcept(concept);
    }
  };

  const handleStartLearning = async (concept) => {
    if (!user) return;
    
    const currentLevel = getConceptMasteryLevel(concept.id);
    if (currentLevel === 0) {
      // Unlock the concept
      await studyApiService.updateConceptMastery(user.id, concept.id, {
        mastery_level: 1
      });
      
      setUserMastery(prev => ({
        ...prev,
        [concept.id]: { ...prev[concept.id], mastery_level: 1, concept_id: concept.id }
      }));
    }
    
    setSelectedConcept(null);
    onConceptSelect?.(concept);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-[Hanken_Grotesk,sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[Cormorant_Garamond,Georgia,serif] text-[22px] font-[500] text-white flex items-center gap-2">
            <Star size={16} className="text-yellow-400/70" />
            Concept Mastery Tree
          </h2>
          <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/25 mt-1">
            Master concepts to unlock advanced topics
          </p>
        </div>
        <div className="text-right">
          <div className="font-[JetBrains_Mono,monospace] text-[24px] font-black text-white leading-none">
            {Object.values(userMastery).filter(m => m.mastery_level >= 3).length}
          </div>
          <div className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-wider text-white/20 mt-0.5">Mastered</div>
        </div>
      </div>

      {/* Category Branches */}
      <div className="space-y-2.5">
        {categories.map(category => {
          const categoryConcepts = getConceptsByCategory(category.id);
          const mastered = getTotalMastered(category.id);
          const isExpanded = expandedCategory === category.id;
          const colorClass = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.red;

          return (
            <div key={category.id} className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-lg shrink-0`}>
                    {category.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white/80 text-[13px]">{category.name}</h3>
                    <p className="text-[11px] text-white/25">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-[JetBrains_Mono,monospace] text-[11px] font-bold text-white/60">{mastered}/{categoryConcepts.length}</span>
                    <span className="font-[JetBrains_Mono,monospace] text-[9px] text-white/20 ml-1">mastered</span>
                  </div>
                  <ChevronRight size={14} className={`text-white/20 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Concepts Grid */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categoryConcepts.map(concept => {
                      const masteryLevel = getConceptMasteryLevel(concept.id);
                      const unlocked = isConceptUnlocked(concept);
                      const masteryInfo = MASTERY_LEVELS[masteryLevel];
                      const MasteryIcon = masteryInfo.icon;

                      const nodeClass = unlocked
                        ? masteryLevel >= 3
                          ? 'bg-emerald-900/15 border-emerald-800/30 hover:border-emerald-700/50 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                          : masteryLevel >= 1
                            ? 'bg-blue-900/10 border-blue-800/25 hover:border-blue-700/40'
                            : 'bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14]'
                        : 'bg-white/[0.015] border-white/[0.04] opacity-40 cursor-not-allowed';

                      const masteryTextColor =
                        masteryInfo.color === 'green' ? 'text-emerald-400' :
                        masteryInfo.color === 'blue' ? 'text-blue-400' :
                        masteryInfo.color === 'yellow' ? 'text-yellow-400' :
                        'text-white/20';

                      return (
                        <button
                          key={concept.id}
                          onClick={() => handleConceptClick(concept)}
                          disabled={!unlocked}
                          className={`relative p-3 rounded-xl text-left transition-all border ${nodeClass}`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-2">
                            <p className={`text-[12px] font-medium truncate ${
                              unlocked ? 'text-white/75' : 'text-white/25'
                            }`}>
                              {concept.name}
                            </p>
                            <MasteryIcon size={13} className={`shrink-0 ${masteryTextColor}`} />
                          </div>
                          <p className={`font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-wider mb-1.5 ${masteryTextColor}`}>
                            {masteryInfo.label}
                          </p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  i <= concept.difficulty ? 'bg-[#c81e1e]/60' : 'bg-white/[0.07]'
                                }`}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Concept Detail Modal */}
      {selectedConcept && (
        <div className="fixed inset-0 bg-[#090909]/90 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  CATEGORY_COLORS[selectedConcept.category?.color] || CATEGORY_COLORS.red
                } flex items-center justify-center text-lg shrink-0`}>
                  {selectedConcept.icon || selectedConcept.category?.icon || '📖'}
                </div>
                <div>
                  <h3 className="font-[Cormorant_Garamond,Georgia,serif] text-[18px] font-[500] text-white">{selectedConcept.name}</h3>
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-white/25">{selectedConcept.category?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                className="p-1.5 hover:bg-white/[0.06] rounded-xl transition-colors"
              >
                <X size={15} className="text-white/30" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.1em] text-white/25 mb-1.5">Overview</p>
                <p className="text-white/55 text-[13px] leading-relaxed">{selectedConcept.description}</p>
              </div>

              {selectedConcept.detailed_explanation && (
                <div>
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.1em] text-white/25 mb-1.5">Detailed Explanation</p>
                  <p className="text-white/50 text-[13px] whitespace-pre-wrap leading-relaxed">{selectedConcept.detailed_explanation}</p>
                </div>
              )}

              {selectedConcept.key_theorists?.length > 0 && (
                <div>
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.1em] text-white/25 mb-1.5">Key Theorists</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConcept.key_theorists.map((theorist, i) => (
                      <span key={i} className="px-2 py-1 bg-white/[0.05] border border-white/[0.07] rounded-xl text-[11px] text-white/60">
                        {theorist}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedConcept.key_works?.length > 0 && (
                <div>
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.1em] text-white/25 mb-1.5">Key Works</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConcept.key_works.map((work, i) => (
                      <span key={i} className="px-2 py-1 bg-white/[0.05] border border-white/[0.07] rounded-xl text-[11px] text-white/50 italic">
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedConcept.prerequisite_ids?.length > 0 && (
                <div>
                  <p className="font-[JetBrains_Mono,monospace] text-[8px] uppercase tracking-[0.1em] text-white/25 mb-1.5">Prerequisites</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedConcept.prerequisite_ids.map(prereqId => {
                      const prereq = concepts.find(c => c.id === prereqId);
                      const prereqLevel = getConceptMasteryLevel(prereqId);
                      return prereq ? (
                        <span
                          key={prereqId}
                          className={`px-2 py-1 rounded-xl text-[11px] flex items-center gap-1 border ${
                            prereqLevel >= 1
                              ? 'bg-emerald-900/15 border-emerald-800/30 text-emerald-400'
                              : 'bg-white/[0.04] border-white/[0.07] text-white/30'
                          }`}
                        >
                          {prereqLevel >= 1 && <CheckCircle size={11} />}
                          {prereq.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <span className="text-[12px] text-white/30">XP for Mastery</span>
                <span className="font-[JetBrains_Mono,monospace] text-[12px] font-bold text-orange-400/80">{selectedConcept.xp_value} XP</span>
              </div>

              <button
                onClick={() => handleStartLearning(selectedConcept)}
                className="w-full py-3 bg-[#c81e1e] hover:bg-[#e02424] rounded-xl font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-[0.08em] text-white transition-colors flex items-center justify-center gap-2"
              >
                {getConceptMasteryLevel(selectedConcept.id) === 0 ? (
                  <><BookOpen size={14} /> Start Learning</>
                ) : (
                  <><Zap size={14} /> Continue Learning</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-4 border-t border-white/[0.05]">
        {Object.entries(MASTERY_LEVELS).map(([level, info]) => {
          const Icon = info.icon;
          const iconColor =
            info.color === 'green' ? 'text-emerald-400' :
            info.color === 'blue' ? 'text-blue-400' :
            info.color === 'yellow' ? 'text-yellow-400' :
            'text-white/20';
          return (
            <div key={level} className="flex items-center gap-1.5">
              <Icon size={12} className={iconColor} />
              <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-white/25">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MasteryTree;
