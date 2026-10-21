import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, X, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const questionComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm">{children}</code>,
};

const InlineExerciseBlock = ({ block }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [numericAnswer, setNumericAnswer] = useState('');
  const [fillAnswer, setFillAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const { exercise_type, question, options, correct_answer, hint, explanation } = block;

  const checkAnswer = () => {
    setIsSubmitted(true);
  };

  const isCorrect = () => {
    switch (exercise_type) {
      case 'multiple_choice':
        return selectedAnswer === correct_answer;
      case 'numeric':
        return parseFloat(numericAnswer) === parseFloat(correct_answer);
      case 'fill_blank':
        return fillAnswer.toLowerCase().trim() === correct_answer.toLowerCase().trim();
      default:
        return false;
    }
  };

  const resetExercise = () => {
    setSelectedAnswer(null);
    setNumericAnswer('');
    setFillAnswer('');
    setIsSubmitted(false);
    setShowHint(false);
  };

  const canSubmit = () => {
    switch (exercise_type) {
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
    <div className="bg-purple-950/20 rounded-none border border-purple-800/30 p-5">
      <div className="mb-4">
        <span className="text-xs text-purple-400 uppercase tracking-wide font-medium">Practice Exercise</span>
        <div className="text-white mt-1 text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={questionComponents}
          >
            {question}
          </ReactMarkdown>
        </div>
      </div>

      {/* Input */}
      <div className="mb-4">
        {exercise_type === 'multiple_choice' && Array.isArray(options) && (
          <div className="space-y-2">
            {options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === correct_answer;

              let bgClass = 'bg-black/30 border-gray-700 hover:border-gray-500';
              if (isSubmitted) {
                if (isCorrectOption) bgClass = 'bg-green-900/30 border-green-500';
                else if (isSelected && !isCorrectOption) bgClass = 'bg-red-900/30 border-red-500';
              } else if (isSelected) {
                bgClass = 'bg-purple-900/20 border-purple-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isSubmitted && setSelectedAnswer(option)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-3 rounded-none border transition-colors flex items-center gap-3 ${bgClass}`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : isSubmitted && isCorrectOption
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-600 text-gray-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-200 flex-1">{option}</span>
                  {isSubmitted && isCorrectOption && <Check className="w-5 h-5 text-green-400 shrink-0" />}
                  {isSubmitted && isSelected && !isCorrectOption && <X className="w-5 h-5 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {exercise_type === 'numeric' && (
          <div className="flex gap-3">
            <input
              type="number"
              step="any"
              value={numericAnswer}
              onChange={(e) => setNumericAnswer(e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter your answer..."
              className={`flex-1 px-4 py-3 rounded-none border bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${
                isSubmitted
                  ? isCorrect()
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-purple-500'
              }`}
            />
            {isSubmitted && (
              <div className={`px-4 py-3 rounded-none flex items-center gap-2 ${
                isCorrect() ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {isCorrect() ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                {!isCorrect() && <span>{correct_answer}</span>}
              </div>
            )}
          </div>
        )}

        {exercise_type === 'fill_blank' && (
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
                  : 'border-gray-700 focus:ring-purple-500'
              }`}
            />
            {isSubmitted && !isCorrect() && (
              <div className="px-4 py-3 rounded-none bg-green-900/30 text-green-400 flex items-center">
                {correct_answer}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint */}
      {hint && !isSubmitted && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 mb-3 text-yellow-500 text-sm hover:text-yellow-400 transition-colors"
        >
          <Lightbulb className="w-4 h-4" />
          {showHint ? 'Hide Hint' : 'Show Hint'}
          {showHint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
      {showHint && (
        <div className="mb-3 p-3 rounded-none bg-yellow-900/20 border border-yellow-900/30 text-yellow-200 text-sm">
          {hint}
        </div>
      )}

      {/* Explanation */}
      {isSubmitted && explanation && (
        <div className="mb-4 p-3 rounded-none bg-blue-900/20 border border-blue-900/30">
          <p className="text-blue-300 text-sm font-medium mb-1">Explanation:</p>
          <p className="text-gray-300 text-sm">{explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        {!isSubmitted ? (
          <button
            onClick={checkAnswer}
            disabled={!canSubmit()}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="text-yellow-500 text-sm font-medium">
            +10 XP
          </span>
        )}
      </div>
    </div>
  );
};

export default InlineExerciseBlock;
