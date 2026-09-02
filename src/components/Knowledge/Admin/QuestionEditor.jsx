import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'swipe', label: 'Swipe (Revolutionary/Reactionary)' },
  { value: 'scenario', label: 'Scenario Analysis' }
];

const QuestionEditor = ({ question, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    order_index: 0
  });

  useEffect(() => {
    if (question) {
      let options = ['', '', '', ''];
      if (question.options) {
        try {
          const parsed = typeof question.options === 'string' 
            ? JSON.parse(question.options) 
            : question.options;
          options = Array.isArray(parsed) ? parsed : options;
        } catch (e) {
          console.error('Error parsing options:', e);
        }
      }
      
      setForm({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        options,
        correct_answer: question.correct_answer || '',
        explanation: question.explanation || '',
        order_index: question.order_index || 0
      });
    }
  }, [question]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;
    const newOptions = form.options.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let data = {
      question_text: form.question_text,
      question_type: form.question_type,
      correct_answer: form.correct_answer,
      explanation: form.explanation,
      order_index: form.order_index
    };

    if (form.question_type === 'true_false') {
      data.options = JSON.stringify(['True', 'False']);
    } else if (form.question_type === 'swipe') {
      data.options = JSON.stringify(['Revolutionary', 'Reactionary']);
    } else if (form.question_type === 'fill_blank') {
      data.options = null;
    } else {
      const validOptions = form.options.filter(o => o.trim());
      data.options = JSON.stringify(validOptions);
    }

    onSave(data);
  };

  const needsOptions = ['multiple_choice', 'scenario'].includes(form.question_type);
  const isSwipeOrTF = ['true_false', 'swipe'].includes(form.question_type);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-none transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Question Type *</label>
            <select
              value={form.question_type}
              onChange={(e) => handleChange('question_type', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Question Text *</label>
            <textarea
              value={form.question_text}
              onChange={(e) => handleChange('question_text', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
              rows={3}
              placeholder={form.question_type === 'fill_blank' 
                ? "Use ___ for the blank (e.g., 'The workers control the ___')"
                : "Enter the question"
              }
              required
            />
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Answer Options *</label>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                      placeholder={`Option ${index + 1}`}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 bg-gray-800 hover:bg-red-600/20 text-red-400 rounded-none transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-none text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>
            </div>
          )}

          {isSwipeOrTF && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-none p-3">
              <p className="text-sm text-gray-400">
                {form.question_type === 'true_false' 
                  ? 'Options will automatically be set to "True" and "False"'
                  : 'Options will automatically be set to "Revolutionary" and "Reactionary"'
                }
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Correct Answer *</label>
            {form.question_type === 'true_false' ? (
              <select
                value={form.correct_answer}
                onChange={(e) => handleChange('correct_answer', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                required
              >
                <option value="">Select...</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            ) : form.question_type === 'swipe' ? (
              <select
                value={form.correct_answer}
                onChange={(e) => handleChange('correct_answer', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                required
              >
                <option value="">Select...</option>
                <option value="Revolutionary">Revolutionary</option>
                <option value="Reactionary">Reactionary</option>
              </select>
            ) : needsOptions ? (
              <select
                value={form.correct_answer}
                onChange={(e) => handleChange('correct_answer', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                required
              >
                <option value="">Select correct answer...</option>
                {form.options.filter(o => o.trim()).map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.correct_answer}
                onChange={(e) => handleChange('correct_answer', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                placeholder="Enter the correct answer"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Explanation</label>
            <textarea
              value={form.explanation}
              onChange={(e) => handleChange('explanation', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
              rows={2}
              placeholder="Explain why this is the correct answer (shown after answering)"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.question_text || !form.correct_answer}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-none transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {question ? 'Update Question' : 'Add Question'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditor;
