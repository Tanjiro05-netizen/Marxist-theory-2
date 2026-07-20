import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
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

const blockSignals = {
  rich_text: { label: 'Reading', icon: BookOpen },
  math: { label: 'Math', icon: Target },
  worked_example: { label: 'Example', icon: Check },
  video: { label: 'Media', icon: Clock },
  simulation_embed: { label: 'Lab', icon: FlaskConical },
  exercise: { label: 'Practice', icon: HelpCircle },
  quiz: { label: 'Quiz', icon: HelpCircle },
  callout: { label: 'Note', icon: Layers },
  image: { label: 'Diagram', icon: Layers },
};

const LessonPage = () => {
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
        setError(getScienceErrorMessage(loadError, 'Could not load this lesson.'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [chapterSlug, courseSlug, lessonSlug]);

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
        userId: user.id,
        courseId: data.course.id,
        moduleId: data.module.id,
        lessonId: data.lesson.id,
        xpReward: data.lesson.xp_reward,
      });
      if (nextLesson) {
        router.push(`/science-tech/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`);
      } else {
        router.push(`/science-tech/courses/${courseSlug}`);
      }
    } catch (completeError) {
      console.error('Error completing Science v2 lesson:', completeError);
      setError(getScienceErrorMessage(completeError, 'Could not save lesson progress.'));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#12131A]">
        <Header />
        <div className="pt-24 text-center text-gray-400">Loading lesson...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#12131A]">
        <Header />
        <main className="pt-24 px-4 text-center">
          <p className="text-red-300">{error || 'Lesson not found.'}</p>
          <Link href={`/science-tech/courses/${courseSlug}`} className="mt-4 inline-flex text-red-400 hover:text-red-300">
            Back to course
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12131A] text-gray-200">
      <Header />
      <main className="pt-20">
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
                  <span>{data.lesson.lesson_kind}</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-white">{data.lesson.title}</h1>
              </div>
              <button
                type="button"
                onClick={() => setShowOutline((value) => !value)}
                className="lg:hidden inline-flex items-center gap-2 border border-gray-800 px-3 py-2 text-gray-300 w-fit"
              >
                <Menu className="w-4 h-4" />
                Syllabus
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 py-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className={`${showOutline ? 'block' : 'hidden'} xl:block`}>
            <div className="sticky top-24 border border-gray-800 bg-black/30">
              <div className="p-4 border-b border-gray-800">
                <p className="text-white font-semibold">Syllabus</p>
                <p className="text-gray-600 text-sm">{data.nav.length} lessons</p>
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
                This lesson has no blocks yet. Add text, math, examples, labs, or practice in Creator Studio.
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
                  Previous
                </Link>
              ) : <span />}

              <div className="flex flex-wrap gap-3">
                {nextLesson && (
                  <Link href={`/science-tech/courses/${courseSlug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`} className="inline-flex items-center gap-2 border border-gray-800 px-4 py-2 text-gray-300 hover:border-gray-600 hover:text-white">
                    Next lesson
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
                <button type="button" onClick={completeLesson} disabled={isCompleting} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-2 text-white font-semibold disabled:opacity-50">
                  <Check className="w-4 h-4" />
                  {isCompleting ? 'Saving...' : nextLesson ? 'Mark complete' : 'Complete course'}
                </button>
              </div>
            </div>
          </section>

          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <Panel title="Lesson Record">
                <Meta label="Module" value={data.module.title} />
                <Meta label="Kind" value={data.lesson.lesson_kind} />
                <Meta label="Time" value={data.lesson.estimated_minutes ? `${data.lesson.estimated_minutes} min` : 'TBD'} />
                <Meta label="Blocks" value={data.blocks.length} />
              </Panel>

              <Panel title="Activity Types">
                <div className="space-y-2">
                  {Object.entries(blockSignals).map(([type, signal]) => {
                    const count = blockSummary[type] || 0;
                    if (!count) return null;
                    const Icon = signal.icon;
                    return (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-400">
                          <Icon className="w-4 h-4 text-gray-600" />
                          {signal.label}
                        </span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Checkpoint">
                <Link href={`/science-tech/courses/${courseSlug}/${chapterSlug}/test`} className="inline-flex items-center justify-between w-full border border-gray-800 px-3 py-2 text-gray-300 hover:border-red-900/60 hover:text-white">
                  Module checkpoint
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Panel>
            </div>
          </aside>
        </div>
      </main>
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
