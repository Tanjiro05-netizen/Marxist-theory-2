import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

const QUIZ_TYPES = [
  { value: 'daily', label: 'Daily Challenge' },
  { value: 'weekly', label: 'Weekly Quiz' },
  { value: 'standard', label: 'Standard Quiz' },
  { value: 'survival', label: 'Survival Mode' }
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const QuizEditor = ({ quiz, onSave, onClose, saving }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    quiz_type: 'standard',
    difficulty: 'medium',
    xp_reward: 25,
    time_limit_seconds: 60,
    day_of_week: null,
    is_active: true
  });

  useEffect(() => {
    if (quiz) {
      setForm({
        title: quiz.title || '',
        description: quiz.description || '',
        quiz_type: quiz.quiz_type || 'standard',
        difficulty: quiz.difficulty || 'medium',
        xp_reward: quiz.xp_reward || 25,
        time_limit_seconds: quiz.time_limit_seconds || 60,
        day_of_week: quiz.day_of_week,
        is_active: quiz.is_active !== false
      });
    }
  }, [quiz]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.quiz_type !== 'daily') {
      data.day_of_week = null;
    }
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-none w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">
            {quiz ? 'Edit Quiz' : 'Create New Quiz'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-none transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              placeholder="Quiz title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none"
              rows={3}
              placeholder="Brief description of the quiz"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quiz Type *</label>
              <select
                value={form.quiz_type}
                onChange={(e) => handleChange('quiz_type', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {QUIZ_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
              >
                {DIFFICULTIES.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.quiz_type === 'daily' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Day of Week *</label>
              <select
                value={form.day_of_week ?? ''}
                onChange={(e) => handleChange('day_of_week', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                required={form.quiz_type === 'daily'}
              >
                <option value="">Select day...</option>
                {DAYS_OF_WEEK.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">XP Reward *</label>
              <input
                type="number"
                value={form.xp_reward}
                onChange={(e) => handleChange('xp_reward', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                min={1}
                max={500}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Limit (sec) *</label>
              <input
                type="number"
                value={form.time_limit_seconds}
                onChange={(e) => handleChange('time_limit_seconds', parseInt(e.target.value) || 30)}
                className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white focus:outline-none focus:border-red-500"
                min={10}
                max={300}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Active (visible to users)
            </label>
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
              disabled={saving || !form.title}
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
                  {quiz ? 'Update Quiz' : 'Create Quiz'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizEditor;
