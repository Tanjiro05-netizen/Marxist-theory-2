import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, BookOpen, Flame, Target, Clock, Grid, Filter, ChevronRight, GitBranch, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { studyApiService } from '../components/Knowledge/api/study';
import ProgressHeader from '../components/Knowledge/Study/ProgressHeader';
import QuizPlayer from '../components/Knowledge/Study/QuizPlayer';
import CellLeaderboard from '../components/Knowledge/Study/CellLeaderboard';
import ScenarioPlayer from '../components/Knowledge/Study/ScenarioPlayer';
import MasteryTree from '../components/Knowledge/Study/MasteryTree';

const KnowledgeStudyPage = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [userCell, setUserCell] = useState(null);
  const [todaysChallenge, setTodaysChallenge] = useState(null);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [activeTab, setActiveTab] = useState('daily'); // daily, catalogue, scenarios, mastery
  const [filterType, setFilterType] = useState('all'); // all, standard, weekly
  const [showScenarioPlayer, setShowScenarioPlayer] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [progressData, cellData, challengeData, completedData, quizzesData, scenariosData] = await Promise.all([
        studyApiService.getUserProgress(user.id),
        studyApiService.getUserCell(user.id),
        studyApiService.getTodaysChallenge(),
        studyApiService.hasCompletedTodaysChallenge(user.id),
        studyApiService.getAllQuizzes(),
        studyApiService.getAllScenarios()
      ]);

      setProgress(progressData);
      setUserCell(cellData);
      setTodaysChallenge(challengeData);
      setHasCompletedToday(completedData);
      setAllQuizzes(quizzesData);
      setScenarios(scenariosData);
    } catch (err) {
      console.error('Error fetching study data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizPlayer(true);
  };

  const handleQuizComplete = () => {
    setShowQuizPlayer(false);
    setSelectedQuiz(null);
    fetchData(); // Refresh data
  };

  const handleCloseQuiz = () => {
    setShowQuizPlayer(false);
    setSelectedQuiz(null);
  };

  const handleStartScenario = (scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioPlayer(true);
  };

  const handleScenarioComplete = (xpEarned) => {
    setShowScenarioPlayer(false);
    setSelectedScenario(null);
    fetchData();
  };

  const handleCloseScenario = () => {
    setShowScenarioPlayer(false);
    setSelectedScenario(null);
  };

  const getDayTopic = () => {
    const topics = [
      { day: 'Sunday', topic: 'Review & Mixed', icon: '📚', color: 'purple' },
      { day: 'Monday', topic: 'Class Analysis', icon: '✊', color: 'red' },
      { day: 'Tuesday', topic: 'Historical Materialism', icon: '📜', color: 'amber' },
      { day: 'Wednesday', topic: 'Surplus Value', icon: '💰', color: 'green' },
      { day: 'Thursday', topic: 'Contradiction ID', icon: '⚡', color: 'blue' },
      { day: 'Friday', topic: 'Praxis Application', icon: '🔥', color: 'orange' },
      { day: 'Saturday', topic: 'Dialectics', icon: '🌀', color: 'indigo' }
    ];
    return topics[new Date().getDay()];
  };

  const dayTopic = getDayTopic();

  // Filter quizzes for catalogue
  const filteredQuizzes = allQuizzes.filter(q => {
    if (filterType === 'all') return q.quiz_type !== 'daily';
    return q.quiz_type === filterType;
  });

  const getQuizTypeLabel = (type) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      standard: 'Standard',
      survival: 'Survival'
    };
    return labels[type] || type;
  };

  const getQuizTypeColor = (type) => {
    const colors = {
      daily: 'text-orange-400 bg-orange-500/20',
      weekly: 'text-blue-400 bg-blue-500/20',
      standard: 'text-green-400 bg-green-500/20',
      survival: 'text-purple-400 bg-purple-500/20'
    };
    return colors[type] || 'text-slate-400 bg-slate-500/20';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-400',
      medium: 'text-yellow-400',
      hard: 'text-orange-400',
      expert: 'text-red-400'
    };
    return colors[difficulty] || 'text-slate-400';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090909] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Zap className="w-10 h-10 text-[#c81e1e] mx-auto" />
          <h1 className="font-[Cormorant_Garamond,Georgia,serif] text-[28px] font-[500] text-white">Study Arena</h1>
          <p className="text-white/40 text-sm font-[Hanken_Grotesk,sans-serif]">Please log in to access the Study Arena</p>
          <Link href="/login"
            className="inline-block bg-[#c81e1e] hover:bg-[#e02424] px-6 py-2 rounded-xl text-white text-sm font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const tabCls = (id) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-all ${
      activeTab === id
        ? 'bg-[rgba(200,30,30,0.15)] text-[#c81e1e] border border-[rgba(200,30,30,0.3)]'
        : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-[#090909] font-[Hanken_Grotesk,sans-serif]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#090909]/95 backdrop-blur border-b border-white/[0.05] py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/knowledge"
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-[11px] font-[JetBrains_Mono,monospace] uppercase tracking-[0.08em] transition-colors"
            >
              <ArrowLeft size={13} /> Knowledge Base
            </Link>
            <span className="text-white/10">|</span>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#c81e1e]" />
              <span className="font-[Cormorant_Garamond,Georgia,serif] text-[18px] font-[500] text-white/80">Study Arena</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Header */}
        {!loading && <ProgressHeader progress={progress} userCell={userCell} />}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setActiveTab('daily')} className={tabCls('daily')}>
            <Flame size={12} /> Daily Challenge
          </button>
          <button onClick={() => setActiveTab('catalogue')} className={tabCls('catalogue')}>
            <Grid size={12} /> Quiz Catalogue
          </button>
          <button onClick={() => setActiveTab('scenarios')} className={tabCls('scenarios')}>
            <GitBranch size={12} /> Scenarios
          </button>
          <button onClick={() => setActiveTab('mastery')} className={tabCls('mastery')}>
            <Star size={12} /> Mastery Tree
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">

            {/* DAILY TAB */}
            {activeTab === 'daily' && (
              <>
                {/* Today's Challenge Card */}
                <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_0_32px_rgba(200,30,30,0.05)]">
                  <div className="border-b border-white/[0.05] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{dayTopic.icon}</span>
                      <div>
                        <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/25">
                          {dayTopic.day}'s Challenge
                        </p>
                        <h2 className="font-[Cormorant_Garamond,Georgia,serif] text-[20px] font-[500] text-white leading-tight">
                          {dayTopic.topic}
                        </h2>
                      </div>
                    </div>
                    {hasCompletedToday && (
                      <div className="flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-[JetBrains_Mono,monospace] uppercase tracking-wider">
                        <Target size={11} /> Completed
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    {todaysChallenge ? (
                      <>
                        <p className="text-white/55 text-[13px] leading-relaxed">{todaysChallenge.description}</p>
                        <div className="flex items-center gap-5 text-[12px] text-white/30">
                          <span className="flex items-center gap-1.5"><BookOpen size={12} />{todaysChallenge.questions?.length || 5} Questions</span>
                          <span className="flex items-center gap-1.5"><Clock size={12} />{todaysChallenge.time_limit_seconds || 60}s per question</span>
                          <span className="flex items-center gap-1.5 text-orange-400/70"><Flame size={12} />{todaysChallenge.xp_reward} XP</span>
                        </div>
                        <button
                          onClick={() => handleStartQuiz(todaysChallenge)}
                          disabled={hasCompletedToday}
                          className={`w-full py-3.5 rounded-xl font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${
                            hasCompletedToday
                              ? 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                              : 'bg-[#c81e1e] hover:bg-[#e02424] text-white shadow-[0_0_20px_rgba(200,30,30,0.2)]'
                          }`}
                        >
                          <Zap size={13} />
                          {hasCompletedToday ? 'Already Completed Today' : 'Start Daily Challenge'}
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-white/25 text-sm">
                        No challenge available today. Check back tomorrow!
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-5">
                  <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/25 mb-4">Weekly Schedule</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[
                      { day: 'Sun', topic: 'Review', icon: '📚' },
                      { day: 'Mon', topic: 'Class', icon: '✊' },
                      { day: 'Tue', topic: 'History', icon: '📜' },
                      { day: 'Wed', topic: 'Value', icon: '💰' },
                      { day: 'Thu', topic: 'Contra.', icon: '⚡' },
                      { day: 'Fri', topic: 'Praxis', icon: '🔥' },
                      { day: 'Sat', topic: 'Dialec.', icon: '🌀' },
                    ].map((item, idx) => {
                      const isToday = new Date().getDay() === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-center transition-all ${
                            isToday
                              ? 'bg-[rgba(200,30,30,0.1)] border border-[rgba(200,30,30,0.3)]'
                              : 'bg-white/[0.02] border border-white/[0.04]'
                          }`}
                        >
                          <div className="text-base mb-1">{item.icon}</div>
                          <div className={`text-[9px] font-[JetBrains_Mono,monospace] font-bold ${isToday ? 'text-[#c81e1e]' : 'text-white/25'}`}>
                            {item.day}
                          </div>
                          <div className={`text-[8px] ${isToday ? 'text-[#c81e1e]/70' : 'text-white/15'}`}>
                            {item.topic}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Survival Mode — coming soon */}
                <div className="bg-[#0f0f0f] border border-white/[0.04] rounded-2xl p-5 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/[0.04] rounded-xl">
                      <Target size={18} className="text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-white/60 font-medium text-[13px]">Survival Mode</h3>
                      <p className="text-white/25 text-[11px]">Coming Soon — sudden death quizzes</p>
                    </div>
                    <span className="ml-auto font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-wider text-white/20 bg-white/[0.04] px-2 py-1 rounded-full">Soon</span>
                  </div>
                </div>
              </>
            )}

            {/* CATALOGUE TAB */}
            {activeTab === 'catalogue' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter size={13} className="text-white/25" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-[#0f0f0f] border border-white/[0.07] rounded-xl px-3 py-1.5 text-[12px] text-white/60 focus:outline-none focus:border-[rgba(200,30,30,0.4)] font-[JetBrains_Mono,monospace]"
                    >
                      <option value="all">All Quizzes</option>
                      <option value="standard">Standard</option>
                      <option value="weekly">Weekly</option>
                      <option value="survival">Survival</option>
                    </select>
                  </div>
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/20">
                    {filteredQuizzes.length} available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredQuizzes.length === 0 ? (
                    <div className="col-span-2 text-center py-16 bg-[#0f0f0f] border border-white/[0.06] rounded-2xl text-white/25">
                      <BookOpen size={28} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No quizzes available yet.</p>
                    </div>
                  ) : (
                    filteredQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.12] transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white/80 font-medium text-[13px] group-hover:text-white transition-colors truncate">
                              {quiz.title}
                            </h3>
                            <p className="text-[11px] text-white/25 mt-0.5 line-clamp-1">
                              {quiz.description || 'Test your knowledge'}
                            </p>
                          </div>
                          <span className={`ml-2 shrink-0 text-[9px] font-[JetBrains_Mono,monospace] uppercase tracking-wider px-2 py-1 rounded-full ${getQuizTypeColor(quiz.quiz_type)}`}>
                            {getQuizTypeLabel(quiz.quiz_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-white/25 mb-3">
                          <span className="flex items-center gap-1"><BookOpen size={11} />{quiz.question_count}q</span>
                          <span className="flex items-center gap-1"><Clock size={11} />{quiz.time_limit_seconds}s</span>
                          <span className={`flex items-center gap-1 capitalize ${getDifficultyColor(quiz.difficulty)}`}>
                            <Target size={11} />{quiz.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                          <span className="text-orange-400/70 text-[11px] font-[JetBrains_Mono,monospace] flex items-center gap-1">
                            <Flame size={11} />{quiz.xp_reward} XP
                          </span>
                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className="flex items-center gap-1 bg-[#c81e1e] hover:bg-[#e02424] text-white px-3 py-1.5 rounded-xl text-[10px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-all"
                          >
                            Start <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* SCENARIOS TAB */}
            {activeTab === 'scenarios' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch size={13} className="text-white/40" />
                    <span className="font-[Cormorant_Garamond,Georgia,serif] text-[20px] font-[500] text-white/80">Historical Scenarios</span>
                  </div>
                  <span className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.1em] text-white/20">
                    {scenarios.length} available
                  </span>
                </div>

                {scenarios.length === 0 ? (
                  <div className="text-center py-16 bg-[#0f0f0f] border border-white/[0.06] rounded-2xl text-white/25">
                    <GitBranch size={28} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No scenarios available yet.</p>
                  </div>
                ) : (
                  scenarios.map(scenario => (
                    <div
                      key={scenario.id}
                      className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-4 hover:border-[rgba(200,30,30,0.2)] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white/80 font-medium text-[14px] group-hover:text-white transition-colors">
                            {scenario.title}
                          </h4>
                          {scenario.setting && (
                            <p className="text-[11px] text-white/25 mt-0.5 font-[JetBrains_Mono,monospace]">
                              {scenario.setting}{scenario.era && ` · ${scenario.era}`}
                            </p>
                          )}
                          {scenario.description && (
                            <p className="text-[12px] text-white/40 mt-2 line-clamp-2">{scenario.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[9px] font-[JetBrains_Mono,monospace] uppercase tracking-wider px-2 py-1 rounded-full bg-white/[0.05] ${getDifficultyColor(scenario.difficulty)}`}>
                          {scenario.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                        <div className="flex items-center gap-4 text-[11px] text-white/25">
                          <span className="flex items-center gap-1"><Clock size={11} />~{scenario.estimated_minutes} min</span>
                          <span className="flex items-center gap-1 text-orange-400/70"><Flame size={11} />{scenario.xp_reward} XP</span>
                        </div>
                        <button
                          onClick={() => handleStartScenario(scenario)}
                          className="flex items-center gap-1 bg-white/[0.06] hover:bg-[rgba(200,30,30,0.15)] hover:border-[rgba(200,30,30,0.3)] border border-white/[0.08] text-white/60 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-[JetBrains_Mono,monospace] uppercase tracking-wider transition-all"
                        >
                          Play <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* MASTERY TAB */}
            {activeTab === 'mastery' && (
              <MasteryTree onConceptSelect={(concept) => console.log('Selected concept:', concept)} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <CellLeaderboard
              userId={user?.id}
              userCell={userCell}
              onCellChange={fetchData}
            />

            {/* Quick Stats */}
            <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-4">
              <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-[0.12em] text-white/25 mb-3">Your Stats</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Total XP', value: (progress?.total_xp || 0).toLocaleString(), cls: 'text-white/70' },
                  { label: 'Streak', value: `${progress?.current_streak || 0} days`, cls: 'text-orange-400/80' },
                  { label: 'Best Streak', value: `${progress?.longest_streak || 0} days`, cls: 'text-white/50' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="flex items-center justify-between text-[12px]">
                    <span className="text-white/30">{label}</span>
                    <span className={`font-medium ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Player Modal */}
      {showQuizPlayer && selectedQuiz && (
        <QuizPlayer
          quiz={selectedQuiz}
          userId={user?.id}
          onComplete={handleQuizComplete}
          onClose={handleCloseQuiz}
        />
      )}

      {/* Scenario Player Modal */}
      {showScenarioPlayer && selectedScenario && (
        <div className="fixed inset-0 bg-[#090909]/95 backdrop-blur z-50 overflow-y-auto">
          <div className="min-h-screen p-4 pt-16">
            <ScenarioPlayer
              scenario={selectedScenario}
              onBack={handleCloseScenario}
              onComplete={handleScenarioComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeStudyPage;
