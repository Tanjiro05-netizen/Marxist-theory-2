import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  fetchScienceCheckpoint,
  getCurrentUser,
  getScienceErrorMessage,
  submitScienceQuizAttempt,
} from '../services/scienceApi';
import {
  ArrowLeft,
  Award,
  Check,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Target,
  X,
} from 'lucide-react';
import 'katex/dist/katex.min.css';

const normalizeOptions = (question) => {
  if (question?.question_type === 'true_false') return ['True', 'False'];
  return question?.options || [];
};

const getAnswerLabel = (t, question, answer) => {
  if (question?.question_type !== 'true_false') return answer;
  if (`${answer || ''}`.toLowerCase() === 'true') return t('science.true');
  if (`${answer || ''}`.toLowerCase() === 'false') return t('science.false');
  return answer;
};

const ChapterTestPage = () => {
  const { t } = useTranslation();
  const { courseSlug, chapterSlug } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [phase, setPhase] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [checkpoint, currentUser] = await Promise.all([
          fetchScienceCheckpoint({ courseSlug, moduleSlug: chapterSlug }),
          getCurrentUser(),
        ]);
        setData(checkpoint);
        setUser(currentUser);
        setSelectedQuizId(checkpoint.quizzes[0]?.id || '');
      } catch (loadError) {
        console.error('Error loading Science checkpoint:', loadError);
        setError(getScienceErrorMessage(loadError, t('science.loadCheckpointError')));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chapterSlug, courseSlug, t]);

  const selectedQuiz = useMemo(
    () => data?.quizzes?.find((quiz) => quiz.id === selectedQuizId) || data?.quizzes?.[0],
    [data, selectedQuizId]
  );

  const questions = useMemo(() => (
    selectedQuiz?.science_quiz_questions?.map((link) => ({
      ...link.science_questions,
      points: link.points || 1,
      linkId: link.id,
    })).filter(Boolean) || []
  ), [selectedQuiz]);

  const startQuiz = () => {
    setAnswers({});
    setResults(null);
    setPhase('taking');
  };

  const setAnswer = (questionId, answer) => {
    setAnswers((value) => ({ ...value, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (!user) {
        router.push(`/login?from=${encodeURIComponent(`/science-tech/courses/${courseSlug}/${chapterSlug}/test`)}`);
        return;
      }

      const nextResults = await submitScienceQuizAttempt({
        quizId: selectedQuiz.id,
        answers,
      });

      setResults(nextResults);
      setPhase('results');
    } catch (submitError) {
      console.error('Error submitting Science checkpoint:', submitError);
      setError(getScienceErrorMessage(submitError, t('science.saveQuizError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 text-center text-gray-400">{t('science.loadingCheckpoint')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 px-4 text-center">
          <p className="text-red-300">{error || t('science.checkpointNotFound')}</p>
          <Link href={`/science-tech/courses/${courseSlug}`} className="mt-4 inline-flex text-red-400 hover:text-red-300">
            {t('science.backToCourse')}
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedQuiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 px-4">
          <div className="mx-auto max-w-3xl border border-gray-800 bg-black/35 p-8 text-center">
            <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">{t('science.noCheckpoint')}</h1>
            <p className="text-gray-500 mt-3">
              {t('science.noCheckpointQuestions')} <span>Add a checkpoint in Creator Studio when the lessons are ready.</span>
            </p>
            <Link href={`/science-tech/courses/${courseSlug}`} className="mt-6 inline-flex items-center gap-2 text-red-400 hover:text-red-300">
              <ArrowLeft className="w-4 h-4" />
              {t('science.backToTitle', { title: data.course.title })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d12]">
      <div className="pb-12">
        <div className="border-b border-gray-800 bg-black/30">
          <div className="container mx-auto max-w-5xl px-4 py-5">
            <Link href={`/science-tech/courses/${courseSlug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" />
              {data.course.title}
            </Link>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-red-400 font-medium">{data.module.title}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{selectedQuiz.title}</h1>
                {selectedQuiz.description && <p className="text-gray-500 mt-2">{selectedQuiz.description}</p>}
              </div>
              {data.quizzes.length > 1 && phase === 'intro' && (
                <select
                  value={selectedQuiz.id}
                  onChange={(event) => setSelectedQuizId(event.target.value)}
                  className="bg-black/60 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-red-500"
                >
                  {data.quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-8">
          {phase === 'intro' && (
            <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="border border-gray-800 bg-black/35 p-6">
                <h2 className="text-xl font-semibold text-white mb-3">{t('science.checkpointOverview')}</h2>
                <p className="text-gray-400 leading-relaxed">
                  {t('science.checkpointDescription')}
                </p>
                <button
                  type="button"
                  onClick={startQuiz}
                  className="mt-6 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 text-white font-semibold"
                >
                  {t('science.startCheckpoint')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <aside className="border border-gray-800 bg-black/35 p-5 h-fit">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-800 bg-black/30 p-3">
                    <p className="text-2xl text-white font-bold">{questions.length}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-600">{t('profile.questions')}</p>
                  </div>
                  <div className="border border-gray-800 bg-black/30 p-3">
                    <p className="text-2xl text-white font-bold">{selectedQuiz.passing_score || 70}%</p>
                    <p className="text-xs uppercase tracking-wide text-gray-600">{t('science.passingScore')}</p>
                  </div>
                </div>
              </aside>
            </section>
          )}

          {phase === 'taking' && (
            <section className="space-y-5">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-800 bg-black/35 p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="text-sm text-gray-600">{t('science.questionProgress', { current: index + 1, total: questions.length })}</p>
                    <p className="text-sm text-yellow-500">{t('science.pointCount', { count: question.points || 1 })}</p>
                  </div>
                  <p className="text-white font-medium mb-4">{question.prompt}</p>

                  {question.question_type === 'multiple_choice' || question.question_type === 'true_false' ? (
                    <div className="space-y-2">
                      {normalizeOptions(question).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAnswer(question.id, option)}
                          className={`w-full text-left border px-4 py-3 transition-colors ${answers[question.id] === option ? 'border-red-500 bg-red-950/20 text-white' : 'border-gray-800 bg-black/30 text-gray-300 hover:border-gray-600'}`}
                        >
                          {question.question_type === 'true_false' ? t(option === 'True' ? 'science.true' : 'science.false') : option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={question.question_type === 'numeric' ? 'number' : 'text'}
                      value={answers[question.id] || ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      className="w-full bg-black/50 border border-gray-700 px-4 py-3 text-white focus:outline-none focus:border-red-500"
                      placeholder={t('science.enterAnswer')}
                    />
                  )}
                </div>
              ))}

              {error && <div className="border border-red-900/40 bg-red-950/20 p-4 text-red-200">{error}</div>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 text-white font-semibold disabled:opacity-50"
                >
                  <Target className="w-4 h-4" />
                  {isSubmitting ? t('science.saving') : t('science.submitCheckpoint')}
                </button>
              </div>
            </section>
          )}

          {phase === 'results' && results && (
            <section className="space-y-5">
              <div className={`border p-6 ${results.passed ? 'border-green-900/40 bg-green-950/20' : 'border-yellow-900/40 bg-yellow-950/10'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-gray-400">{t('science.checkpointScore')}</p>
                    <h2 className="text-4xl font-bold text-white mt-1">{results.score}%</h2>
                    <p className={results.passed ? 'text-green-300 mt-2' : 'text-yellow-300 mt-2'}>
                      {results.passed ? t('science.passed') : t('science.reviewTryAgain', { score: selectedQuiz.passing_score || 70 })}
                    </p>
                  </div>
                  <Award className={`w-14 h-14 ${results.passed ? 'text-green-400' : 'text-yellow-500'}`} />
                </div>
              </div>

              {results.questionResults.map((result, index) => (
                <div key={result.question_id} className="border border-gray-800 bg-black/35 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {result.is_correct ? <Check className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
                    <p className="text-white font-medium">{t('science.questionNumber', { number: index + 1 })}</p>
                  </div>
                  <p className="text-gray-300 mb-2">{result.prompt}</p>
                  <p className="text-sm text-gray-500">{t('science.yourAnswer')} <span className="text-gray-300">{getAnswerLabel(t, questions[index], result.user_answer) || t('science.noAnswer')}</span></p>
                  {!result.is_correct && result.correct_answer != null && (
                    <p className="text-sm text-gray-500">
                      {t('science.correctAnswer')} <span className="text-green-300">{getAnswerLabel(t, questions[index], result.correct_answer)}</span>
                    </p>
                  )}
                  {result.explanation && <p className="mt-3 border border-blue-900/40 bg-blue-950/20 p-3 text-blue-100 text-sm">{result.explanation}</p>}
                </div>
              ))}

              <div className="flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={startQuiz}
                  className="inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-gray-300 hover:text-white hover:border-gray-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('science.tryAgain')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/science-tech/courses/${courseSlug}`)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 text-white font-semibold"
                >
                  {t('science.backToCourse')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterTestPage;
