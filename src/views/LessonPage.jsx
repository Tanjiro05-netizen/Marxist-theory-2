import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import ScienceBlockRenderer from '../components/ScienceTechV2/ScienceBlockRenderer';
import {
  completeScienceLesson,
  fetchScienceLesson,
  getCurrentUser,
  getScienceErrorMessage,
} from '../services/scienceApi';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  HelpCircle,
  Layers,
  Menu,
  Target,
} from 'lucide-react';
import 'katex/dist/katex.min.css';

const blockSignals = {
  rich_text: { labelKey: 'science.reading', icon: BookOpen },
  math: { labelKey: 'science.math', icon: Target },
  worked_example: { labelKey: 'science.example', icon: Check },
  video: { labelKey: 'science.media', icon: Clock },
  simulation_embed: { labelKey: 'science.lab', icon: FlaskConical },
  exercise: { labelKey: 'science.practice', icon: HelpCircle },
  quiz: { labelKey: 'science.quiz', icon: HelpCircle },
  callout: { labelKey: 'science.note', icon: Layers },
  image: { labelKey: 'science.diagram', icon: Layers },
};

const lessonKindKeys = {
  concept: 'science.lessonKindConcept',
  practice: 'science.lessonKindPractice',
  lab: 'science.lessonKindLab',
  quiz: 'science.lessonKindQuiz',
  project: 'science.lessonKindProject',
  review: 'science.lessonKindReview',
};

const LessonPage = () => {
  const { t } = useTranslation();
  const { courseSlug, chapterSlug, lessonSlug } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showOutline, setShowOutline] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [lessonData, currentUser] = await Promise.all([
          fetchScienceLesson({ courseSlug, moduleSlug: chapterSlug, lessonSlug }),
          getCurrentUser(),
        ]);
        setData(lessonData);
        setUser(currentUser);
      } catch (loadError) {
        console.error('Error loading Science v2 lesson:', loadError);
        setError(getScienceErrorMessage(loadError, t('science.loadLessonError')));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chapterSlug, courseSlug, lessonSlug, t]);

  const questionsById = useMemo(() => {
    const lookup = {};
    (data?.questions || []).forEach((question) => {
      lookup[question.id] = question;
    });
    (data?.quizzes || []).forEach((quiz) => {
      (quiz.science_quiz_questions || []).forEach((link) => {
        if (link.science_questions) lookup[link.science_questions.id] = link.science_questions;
      });
    });
    return lookup;
  }, [data]);

  const blockSummary = useMemo(() => {
    const counts = {};
    (data?.blocks || []).forEach((block) => {
      counts[block.block_type] = (counts[block.block_type] || 0) + 1;
    });
    return counts;
  }, [data]);

  const previousLesson = data?.navIndex > 0 ? data.nav[data.navIndex - 1] : null;
  const nextLesson = data?.navIndex < (data?.nav?.length || 0) - 1 ? data.nav[data.navIndex + 1] : null;

  const completeLesson = async () => {
    if (!data?.lesson || !user) {
      router.push(`/login?from=${encodeURIComponent(`/science-tech/courses/${courseSlug}/${chapterSlug}/${lessonSlug}`)}`);
      return;
    }

    setIsCompleting(true);
    setError('');
    try {
      if (data.demoMode && !user) {
        if (nextLesson) {
          router.push(`/science-tech/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`);
        } else {
          router.push(`/science-tech/courses/${courseSlug}`);
        }
        return;
      }
      await completeScienceLesson({
        lessonId: data.lesson.id,
      });
      if (nextLesson) {
        router.push(`/science-tech/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`);
      } else {
        router.push(`/science-tech/courses/${courseSlug}`);
      }
    } catch (completeError) {
      console.error('Error completing Science v2 lesson:', completeError);
      setError(getScienceErrorMessage(completeError, t('science.saveProgressError')));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 text-center text-gray-400">{t('science.loadingLesson')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 px-4 text-center">
          <p className="text-red-300">{error || t('science.lessonNotFound')}</p>
          <Link href={`/science-tech/courses/${courseSlug}`} className="mt-4 inline-flex text-red-400 hover:text-red-300">
            {t('science.backToCourse')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-gray-200">
      <div className="pb-12">
        <div className="border-b border-gray-800 bg-black/35">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link href={`/science-tech/courses/${courseSlug}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  {data.course.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{data.module.title}</span>
                  <span>/</span>
                  <span>{lessonKindKeys[data.lesson.lesson_kind] ? t(lessonKindKeys[data.lesson.lesson_kind]) : data.lesson.lesson_kind}</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-white">{data.lesson.title}</h1>
              </div>
              <button
                type="button"
                onClick={() => setShowOutline((value) => !value)}
                className="lg:hidden inline-flex items-center gap-2 border border-gray-800 px-3 py-2 text-gray-300 w-fit"
              >
                <Menu className="w-4 h-4" />
                {t('science.syllabus')}
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className={`${showOutline ? 'block' : 'hidden'} xl:block`}>
            <div className="sticky top-24 border border-gray-800 bg-black/30">
              <div className="p-4 border-b border-gray-800">
                <p className="text-white font-semibold">{t('science.syllabus')}</p>
                <p className="text-gray-600 text-sm">{t('science.lessonCount', { count: data.nav.length })}</p>
              </div>
              <div className="max-h-[72vh] overflow-y-auto">
                {data.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border-b border-gray-800/60 last:border-b-0">
                    <p className="px-4 pt-4 pb-2 text-xs uppercase tracking-wide text-gray-600">
                      {String(moduleIndex + 1).padStart(2, '0')} · {module.title}
                    </p>
                    {(module.science_lessons || []).map((lesson, lessonIndex) => {
                      const active = module.slug === chapterSlug && lesson.slug === lessonSlug;
                      return (
                        <Link
                          key={lesson.id}
                          href={`/science-tech/courses/${courseSlug}/${module.slug}/${lesson.slug}`}
                          className={`grid grid-cols-[34px_1fr] gap-2 px-4 py-2.5 text-sm border-l-2 ${active ? 'border-red-500 bg-red-950/20 text-white' : 'border-transparent text-gray-500 hover:text-white hover:bg-black/30'}`}
                        >
                          <span className="text-xs font-mono text-gray-700">{moduleIndex + 1}.{lessonIndex + 1}</span>
                          <span className="line-clamp-2">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-5 min-w-0">
            {data.lesson.summary && (
              <div className="border border-gray-800 bg-black/30 p-4 text-gray-300">
                {data.lesson.summary}
              </div>
            )}

            {data.blocks.length === 0 ? (
              <div className="border border-yellow-900/40 bg-yellow-950/10 p-6 text-yellow-200">
                {t('science.noLessonBlocks')} <span>Add text, math, examples, labs, or practice in Creator Studio.</span>
              </div>
            ) : (
              data.blocks.map((block) => (
                <ScienceBlockRenderer key={block.id} block={block} questionsById={questionsById} />
              ))
            )}

            {error && <div className="border border-red-900/40 bg-red-950/20 p-4 text-red-200">{error}</div>}

            <div className="border-t border-gray-800 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {previousLesson ? (
                <Link href={`/science-tech/courses/${courseSlug}/${previousLesson.moduleSlug}/${previousLesson.lessonSlug}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                  {t('common.previous')}
                </Link>
              ) : <span />}

              <div className="flex flex-wrap gap-3">
                {nextLesson && (
                  <Link href={`/science-tech/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`} className="inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-gray-300 hover:border-gray-600 hover:text-white">
                    {t('science.nextLesson')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
                <button type="button" onClick={completeLesson} disabled={isCompleting} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 text-white font-semibold disabled:opacity-50">
                  <Check className="w-4 h-4" />
                  {isCompleting ? t('science.saving') : nextLesson ? t('science.markComplete') : t('science.completeCourse')}
                </button>
              </div>
            </div>
          </section>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <Panel title={t('science.lessonRecord')}>
                <Meta label={t('science.module')} value={data.module.title} />
                <Meta label={t('science.kind')} value={lessonKindKeys[data.lesson.lesson_kind] ? t(lessonKindKeys[data.lesson.lesson_kind]) : data.lesson.lesson_kind} />
                <Meta label={t('science.time')} value={data.lesson.estimated_minutes ? t('science.minuteCount', { count: data.lesson.estimated_minutes }) : t('science.tbd')} />
                <Meta label={t('science.blocks')} value={data.blocks.length} />
              </Panel>

              <Panel title={t('science.activityTypes')}>
                <div className="space-y-2">
                  {Object.entries(blockSignals).map(([type, signal]) => {
                    const count = blockSummary[type] || 0;
                    if (!count) return null;
                    const Icon = signal.icon;
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                          <Icon className="w-4 h-4 text-gray-600" />
                          {t(signal.labelKey)}
                        </span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title={t('science.checkpoint')}>
                <Link href={`/science-tech/courses/${courseSlug}/${chapterSlug}/test`} className="inline-flex items-center justify-between w-full border border-gray-800 px-3 py-2 text-gray-300 hover:border-red-900/60 hover:text-white">
                  {t('science.moduleCheckpoint')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Panel>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Panel = ({ title, children }) => (
  <div className="border border-gray-800 bg-black/30 p-4">
    <h2 className="text-white font-semibold mb-3">{title}</h2>
    {children}
  </div>
);

const Meta = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-800 py-2 last:border-b-0">
    <span className="text-xs uppercase tracking-wide text-gray-600">{label}</span>
    <span className="text-sm text-gray-300 text-right">{value}</span>
  </div>
);

export default LessonPage;
