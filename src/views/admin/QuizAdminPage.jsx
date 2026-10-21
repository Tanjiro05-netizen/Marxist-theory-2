import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studyApiService } from '../../components/Knowledge/api/study';
import QuizEditor from '../../components/Knowledge/Admin/QuizEditor';
import QuestionEditor from '../../components/Knowledge/Admin/QuestionEditor';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, 
  Loader2, AlertTriangle, BookOpen, Clock, Target, Flame,
  GripVertical, RefreshCw
} from 'lucide-react';

const QUIZ_TYPE_LABELS = {
  daily: { label: 'Daily', color: 'text-orange-400 bg-orange-500/20' },
  weekly: { label: 'Weekly', color: 'text-blue-400 bg-blue-500/20' },
  standard: { label: 'Standard', color: 'text-green-400 bg-green-500/20' },
  survival: { label: 'Survival', color: 'text-purple-400 bg-purple-500/20' }
};

const DIFFICULTY_COLORS = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  expert: 'text-red-400'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const QuizAdminPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [filterType, setFilterType] = useState('all');
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState({});
  
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studyApiService.getAllQuizzesAdmin();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes');
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const fetchQuestions = async (quizId) => {
    try {
      const quiz = await studyApiService.getQuizWithQuestions(quizId);
      setQuizQuestions(prev => ({ ...prev, [quizId]: quiz.questions || [] }));
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  };

  const handleExpandQuiz = async (quizId) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
    } else {
      setExpandedQuiz(quizId);
      if (!quizQuestions[quizId]) {
        await fetchQuestions(quizId);
      }
    }
  };

  const handleCreateQuiz = () => {
    setEditingQuiz(null);
    setShowQuizEditor(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setShowQuizEditor(true);
  };

  const handleSaveQuiz = async (data) => {
    setSaving(true);
    try {
      if (editingQuiz) {
        await studyApiService.updateQuiz(editingQuiz.id, data);
      } else {
        await studyApiService.createQuiz(data);
      }
      setShowQuizEditor(false);
      setEditingQuiz(null);
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setError('Failed to save quiz');
    }
    setSaving(false);
  };

  const handleDeleteQuiz = async (quizId) => {
    setSaving(true);
    try {
      await studyApiService.deleteQuiz(quizId);
      setDeleteConfirm(null);
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      setError('Failed to delete quiz');
    }
    setSaving(false);
  };

  const handleToggleActive = async (quiz) => {
    try {
      await studyApiService.updateQuiz(quiz.id, { is_active: !quiz.is_active });
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to toggle quiz:', err);
    }
  };

  const handleCreateQuestion = (quizId) => {
    setEditingQuizId(quizId);
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (quizId, question) => {
    setEditingQuizId(quizId);
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = async (data) => {
    setSaving(true);
    try {
      if (editingQuestion) {
        await studyApiService.updateQuestion(editingQuestion.id, data);
      } else {
        const questions = quizQuestions[editingQuizId] || [];
        data.order_index = questions.length;
        await studyApiService.createQuestion(editingQuizId, data);
      }
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      await fetchQuestions(editingQuizId);
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to save question:', err);
      setError('Failed to save question');
    }
    setSaving(false);
  };

  const handleDeleteQuestion = async (quizId, questionId) => {
    try {
      await studyApiService.deleteQuestion(questionId);
      await fetchQuestions(quizId);
      await fetchQuizzes();
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    filterType === 'all' || q.quiz_type === filterType
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quiz Management</h1>
            <p className="text-gray-400 mt-1">Create and manage quizzes, challenges, and games</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchQuizzes}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-none transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={handleCreateQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-none transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-none flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-400">Filter:</span>
          {['all', 'daily', 'weekly', 'standard', 'survival'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-none text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? 'All' : QUIZ_TYPE_LABELS[type]?.label || type}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No quizzes found.</p>
            <button
              onClick={handleCreateQuiz}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-none transition-colors"
            >
              Create Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="bg-gray-800/50 border border-gray-700 rounded-none overflow-hidden">
                <div className="flex items-center p-4">
                  <button
                    onClick={() => handleExpandQuiz(quiz.id)}
                    className="p-2 hover:bg-gray-700 rounded-none transition-colors mr-2"
                  >
                    {expandedQuiz === quiz.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold ${quiz.is_active ? 'text-white' : 'text-gray-500'}`}>
                        {quiz.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${QUIZ_TYPE_LABELS[quiz.quiz_type]?.color || 'bg-gray-700'}`}>
                        {QUIZ_TYPE_LABELS[quiz.quiz_type]?.label || quiz.quiz_type}
                      </span>
                      {quiz.quiz_type === 'daily' && quiz.day_of_week !== null && (
                        <span className="text-xs text-gray-500">
                          ({DAY_NAMES[quiz.day_of_week]})
                        </span>
                      )}
                      {!quiz.is_active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {quiz.question_count} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {quiz.time_limit_seconds}s
                      </span>
                      <span className={`flex items-center gap-1 ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
                        <Target className="w-3.5 h-3.5" />
                        {quiz.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        <Flame className="w-3.5 h-3.5" />
                        {quiz.xp_reward} XP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(quiz)}
                      className={`p-2 rounded-none transition-colors ${
                        quiz.is_active
                          ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                      title={quiz.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {quiz.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditQuiz(quiz)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-none transition-colors"
                      title="Edit Quiz"
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'quiz', id: quiz.id, title: quiz.title })}
                      className="p-2 bg-gray-700 hover:bg-red-600/30 rounded-none transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {expandedQuiz === quiz.id && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-300">Questions</h4>
                      <button
                        onClick={() => handleCreateQuestion(quiz.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-none text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    {!quizQuestions[quiz.id] ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      </div>
                    ) : quizQuestions[quiz.id].length === 0 ? (
                      <p className="text-center py-6 text-gray-500 text-sm">
                        No questions yet. Add your first question above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {quizQuestions[quiz.id].map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-start gap-3 p-3 bg-gray-800 rounded-none"
                          >
                            <div className="flex items-center gap-2 pt-0.5">
                              <GripVertical className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-mono text-gray-500 w-5">
                                {index + 1}.
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white line-clamp-2">
                                {question.question_text}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="bg-gray-700 px-2 py-0.5 rounded">
                                  {question.question_type.replace('_', ' ')}
                                </span>
                                <span className="text-green-400">
                                  Answer: {question.correct_answer}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditQuestion(quiz.id, question)}
                                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(quiz.id, question.id)}
                                className="p-1.5 hover:bg-red-600/30 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showQuizEditor && (
        <QuizEditor
          quiz={editingQuiz}
          onSave={handleSaveQuiz}
          onClose={() => {
            setShowQuizEditor(false);
            setEditingQuiz(null);
          }}
          saving={saving}
        />
      )}

      {showQuestionEditor && (
        <QuestionEditor
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onClose={() => {
            setShowQuestionEditor(false);
            setEditingQuestion(null);
            setEditingQuizId(null);
          }}
          saving={saving}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-none p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-600/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Quiz?</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <strong className="text-white">{deleteConfirm.title}</strong>? 
              This will also delete all questions in this quiz. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-none transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteQuiz(deleteConfirm.id)}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-none transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAdminPage;
