import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import CollectButton from './CollectButton';

const QuizPlayer = ({ quiz, userId, onComplete, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz?.time_limit_seconds || 60);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Timer countdown
  useEffect(() => {
    if (quizComplete || showFeedback) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return quiz?.time_limit_seconds || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, quizComplete, showFeedback]);

  const handleTimeout = useCallback(() => {
    if (!showFeedback) {
      handleAnswer(null);
    }
  }, [showFeedback]);

  const handleAnswer = (answer) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    const correct = answer?.toLowerCase() === currentQuestion?.correct_answer?.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer,
        correct,
        question_id: currentQuestion.id
      }
    }));
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setTimeLeft(quiz?.time_limit_seconds || 60);
    
    if (currentIndex + 1 >= totalQuestions) {
      calculateResults();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const calculateResults = () => {
    const correctCount = Object.values(answers).filter(a => a.correct).length;
    const score = correctCount;
    const maxScore = totalQuestions;
    const percentage = Math.round((score / maxScore) * 100);
    const xpEarned = Math.floor((score / maxScore) * (quiz?.xp_reward || 50));
    
    setResults({
      score,
      maxScore,
      percentage,
      xpEarned,
      answers
    });
    setQuizComplete(true);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const { question_type, question_text, options } = currentQuestion;
    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;

    return (
      <div className="space-y-6">
        {/* Question Text */}
        <div className="text-center">
          <p className="text-lg text-white font-medium leading-relaxed">
            {question_text}
          </p>
        </div>

        {/* Options */}
        {question_type === 'multiple_choice' && parsedOptions && (
          <div className="space-y-3">
            {parsedOptions.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
              
              let buttonClass = 'w-full p-4 rounded-none border text-left transition-all ';
              
              if (showFeedback) {
                if (isCorrectAnswer) {
                  buttonClass += 'bg-emerald-900/15 border-emerald-700/40 text-emerald-400';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonClass += 'bg-[rgba(179, 18, 46,0.08)] border-[rgba(179, 18, 46,0.35)] text-[#b3122e]';
                } else {
                  buttonClass += 'bg-white/[0.02] border-white/[0.05] text-white/20';
                }
              } else {
                buttonClass += isSelected
                  ? 'bg-[rgba(179, 18, 46,0.1)] border-[rgba(179, 18, 46,0.4)] text-white'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.06] hover:border-white/[0.12]';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleAnswer(option)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {question_type === 'true_false' && (
          <div className="flex gap-4">
            {['True', 'False'].map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
              
              let buttonClass = 'flex-1 p-6 rounded-none border text-center transition-all ';
              
              if (showFeedback) {
                if (isCorrectAnswer) {
                  buttonClass += 'bg-emerald-900/15 border-emerald-700/40 text-emerald-400';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonClass += 'bg-[rgba(179, 18, 46,0.08)] border-[rgba(179, 18, 46,0.35)] text-[#b3122e]';
                } else {
                  buttonClass += 'bg-white/[0.02] border-white/[0.05] text-white/20';
                }
              } else {
                buttonClass += isSelected
                  ? 'bg-[rgba(179, 18, 46,0.1)] border-[rgba(179, 18, 46,0.4)] text-white'
                  : 'bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.06]';
              }

              return (
                <button
                  key={option}
                  onClick={() => !showFeedback && handleAnswer(option)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <span className="text-lg font-bold">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {question_type === 'fill_blank' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Type your answer..."
              className="w-full p-4 bg-white/[0.04] border border-white/[0.08] rounded-none text-white placeholder-white/25 focus:outline-none focus:border-[rgba(179, 18, 46,0.5)] transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value && !showFeedback) {
                  handleAnswer(e.target.value);
                }
              }}
              disabled={showFeedback}
            />
            {!showFeedback && (
              <p className="text-xs text-slate-500 text-center">Press Enter to submit</p>
            )}
          </div>
        )}

        {question_type === 'swipe' && parsedOptions && (
          <div className="flex gap-4">
            {parsedOptions.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
              
              let buttonClass = 'flex-1 p-6 rounded-none border text-center transition-all ';
              const isRevolutionary = option.toLowerCase() === 'revolutionary';
              
              if (showFeedback) {
                if (isCorrectAnswer) {
                  buttonClass += 'bg-emerald-900/15 border-emerald-700/40 text-emerald-400';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonClass += 'bg-[rgba(179, 18, 46,0.08)] border-[rgba(179, 18, 46,0.35)] text-[#b3122e]';
                } else {
                  buttonClass += 'bg-white/[0.02] border-white/[0.05] text-white/20';
                }
              } else {
                buttonClass += isRevolutionary
                  ? 'bg-emerald-900/15 border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/25'
                  : 'bg-[rgba(179, 18, 46,0.06)] border-[rgba(179, 18, 46,0.2)] text-[#b3122e]/80 hover:bg-[rgba(179, 18, 46,0.1)]';
              }

              return (
                <button
                  key={option}
                  onClick={() => !showFeedback && handleAnswer(option)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <span className="text-lg font-bold">{option}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Results screen
  if (quizComplete && results) {
    return (
      <div className="fixed inset-0 bg-[#0b0d12]/95 backdrop-blur flex items-center justify-center z-50 p-4">
        <div className="bg-[#10131b] border border-white/[0.08] rounded-none max-w-md w-full p-6 relative">
          <CollectButton
            results={results}
            quiz={quiz}
            userId={userId}
            onCollected={onComplete}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0b0d12]/95 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-[#10131b] border border-white/[0.08] rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto font-[Outfit,sans-serif]">
        {/* Header */}
        <div className="sticky top-0 bg-[#10131b] border-b border-white/[0.05] p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-[JetBrains_Mono,monospace] text-[10px] uppercase tracking-[0.1em] text-white/30">
              Q {currentIndex + 1}/{totalQuestions}
            </span>
            <div className="flex items-center gap-1.5 text-orange-400/70">
              <Clock size={13} />
              <span className="font-[JetBrains_Mono,monospace] text-[12px] font-bold">{timeLeft}s</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.05] rounded-none transition-colors"
          >
            <X size={16} className="text-white/30" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-white/[0.05]">
          <div
            className="h-full bg-[#b3122e] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Content */}
        <div className="p-6">
          {renderQuestion()}
        </div>

        {/* Feedback */}
        {showFeedback && currentQuestion && (
          <div className={`mx-5 mb-4 p-4 rounded-none border ${
            isCorrect
              ? 'bg-emerald-900/10 border-emerald-800/30'
              : 'bg-[rgba(179, 18, 46,0.06)] border-[rgba(179, 18, 46,0.2)]'
          }`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={16} className="text-[#b3122e] shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-[12px] font-medium ${ isCorrect ? 'text-emerald-400' : 'text-[#b3122e]'}`}>
                  {isCorrect ? 'Correct!' : `Incorrect — Answer: ${currentQuestion.correct_answer}`}
                </p>
                {currentQuestion.explanation && (
                  <p className="text-[11px] text-white/35 mt-1">{currentQuestion.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {showFeedback && (
          <div className="p-4 border-t border-white/[0.05]">
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 bg-[#b3122e] hover:bg-[#d41f3d] text-white py-3 rounded-none font-[JetBrains_Mono,monospace] text-[11px] uppercase tracking-[0.08em] transition-all"
            >
              {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
