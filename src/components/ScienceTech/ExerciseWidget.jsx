import React, { useState } from 'react';
import { Check, X, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const ExerciseWidget = ({ exercise, index }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [numericAnswer, setNumericAnswer] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const checkAnswer = () => {
    setIsSubmitted(true);
    setShowExplanation(true);
  };

  const isCorrect = () => {
    switch (exercise.exercise_type) {
      case 'multiple_choice':
        return selectedAnswer === exercise.correct_answer;
      case 'numeric':
        return parseFloat(numericAnswer) === parseFloat(exercise.correct_answer);
      case 'fill_blank':
        return fillAnswer.toLowerCase().trim() === exercise.correct_answer.toLowerCase().trim();
      default:
        return false;
    }
  };

  const resetExercise = () => {
    setSelectedAnswer(null);
    setNumericAnswer('');
    setFillAnswer('');
    setIsSubmitted(false);
    setShowExplanation(false);
    setShowHint(false);
  };

  const renderExerciseInput = () => {
    switch (exercise.exercise_type) {
      case 'multiple_choice':
        const options = exercise.options || [];
        return (
          <div className="space-y-2">
            {options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === exercise.correct_answer;
              
              let bgClass = 'bg-black/30 border-gray-700 hover:border-gray-500';
              if (isSubmitted) {
                if (isCorrectOption) {
                  bgClass = 'bg-green-900/30 border-green-500';
                } else if (isSelected && !isCorrectOption) {
                  bgClass = 'bg-red-900/30 border-red-500';
                }
              } else if (isSelected) {
                bgClass = 'bg-red-900/20 border-red-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isSubmitted && setSelectedAnswer(option)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3 rounded-none border transition-colors flex items-center gap-3 ${bgClass}`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                    isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-gray-600 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-200 flex-1">{option}</span>
                  {isSubmitted && isCorrectOption && <Check className="w-5 h-5 text-green-400" />}
                  {isSubmitted && isSelected && !isCorrectOption && <X className="w-5 h-5 text-red-400" />}
                </button>
              );
            })}
          </div>
        );

      case 'numeric':
        return (
          <div className="flex gap-3">
            <input
              type="number"
              value={numericAnswer}
              onChange={(e) => setNumericAnswer(e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer..."
              className={`flex-1 px-4 py-3 rounded-none border bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                isSubmitted 
                  ? isCorrect() 
                    ? 'border-green-500 focus:ring-green-500' 
                    : 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-red-500'
              }`}
            />
            {isSubmitted && (
              <div className={`px-4 py-3 rounded-none flex items-center gap-2 ${
                isCorrect() ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {isCorrect() ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {!isCorrect() && <span>{exercise.correct_answer}</span>}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="flex gap-3">
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              disabled={isSubmitted}
              placeholder="Fill in the blank..."
              className={`flex-1 px-4 py-3 rounded-none border bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                isSubmitted 
                  ? isCorrect() 
                    ? 'border-green-500 focus:ring-green-500' 
                    : 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-red-500'
              }`}
            />
            {isSubmitted && !isCorrect() && (
              <div className="px-4 py-3 rounded-none bg-green-900/30 text-green-400 flex items-center">
                {exercise.correct_answer}
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500">Unknown exercise type</p>;
    }
  };

  const canSubmit = () => {
    switch (exercise.exercise_type) {
      case 'multiple_choice':
        return selectedAnswer !== null;
      case 'numeric':
        return numericAnswer !== '';
      case 'fill_blank':
        return fillAnswer !== '';
      default:
        return false;
    }
  };

  return (
    <div className="bg-black/20 rounded-none p-4 border border-gray-800">
      {/* Question */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          Exercise {index + 1}
        </span>
        <p className="text-white mt-1">{exercise.question}</p>
      </div>

      {/* Input */}
      {renderExerciseInput()}

      {/* Hint */}
      {exercise.hint && !isSubmitted && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 mt-4 text-yellow-500 text-sm hover:text-yellow-400 transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          {showHint ? 'Hide Hint' : 'Show Hint'}
          {showHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
      {showHint && (
        <div className="mt-2 p-3 rounded-none bg-yellow-900/20 border border-yellow-900/30 text-yellow-200 text-sm">
          {exercise.hint}
        </div>
      )}

      {/* Explanation */}
      {isSubmitted && exercise.explanation && (
        <div className="mt-4 p-3 rounded-none bg-blue-900/20 border border-blue-900/30">
          <p className="text-blue-300 text-sm font-medium mb-1">Explanation:</p>
          <p className="text-gray-300 text-sm">{exercise.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
        {!isSubmitted ? (
          <button
            onClick={checkAnswer}
            disabled={!canSubmit()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 text-sm font-medium ${
              isCorrect() ? 'text-green-400' : 'text-red-400'
            }`}>
              {isCorrect() ? (
                <>
                  <Check className="w-4 h-4" />
                  Correct!
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Incorrect
                </>
              )}
            </span>
            <button
              onClick={resetExercise}
              className="px-3 py-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
        
        {isSubmitted && isCorrect() && (
          <span className="text-yellow-500 text-sm font-medium flex items-center gap-1">
            +10 XP
          </span>
        )}
      </div>
    </div>
  );
};

export default ExerciseWidget;
