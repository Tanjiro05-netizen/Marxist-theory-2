import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  enrollInScienceCourse,
  fetchScienceCourse,
  getCurrentUser,
  getScienceErrorMessage,
} from '../services/scienceApi';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  HelpCircle,
  Layers,
  Lock,
  Target,
} from 'lucide-react';
import 'katex/dist/katex.min.css';

const levelLabel = {
  beginner: 'science.levelBeginner',
  intermediate: 'science.levelIntermediate',
  advanced: 'science.levelAdvanced',
};

const lessonKindIcon = {
  concept: BookOpen,
  practice: Target,
  lab: FlaskConical,
  quiz: HelpCircle,
  project: Layers,
  review: Check,
};

const minutesToLabel = (t, minutes) => {
  if (!minutes) return t('science.tbd');
  if (minutes < 60) return t('science.minuteCount', { count: minutes });
  return t('science.hourCount', { count: Math.round(minutes / 60) });
};

const CoursePage = () => {
  const { t } = useTranslation();
  const { courseSlug } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [courseData, currentUser] = await Promise.all([fetchScienceCourse(courseSlug), getCurrentUser()]);
        setCourse(courseData.course);
        setModules(courseData.modules);
        setUser(currentUser);
        setDemoMode(Boolean(courseData.demoMode || courseData.course?.metadata?.local_demo));
        setExpanded(courseData.modules.reduce((map, module, index) => ({ ...map, [module.id]: index === 0 }), {}));
        if (courseData.demoMode || courseData.course?.metadata?.local_demo) {
          setEnrolled(true);
          return;
        }
        if (currentUser) {
          const enrollments = courseData.course.science_enrollments || [];
          setEnrolled(enrollments.some((item) => item.user_id === currentUser.id));
        }
      } catch (loadError) {
        console.error('Error loading Science v2 course:', loadError);
        setError(getScienceErrorMessage(loadError, t('science.loadCourseError')));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [courseSlug, t]);

  const stats = useMemo(() => {
    const lessons = modules.flatMap((module) => module.science_lessons || []);
    const blocks = lessons.flatMap((lesson) => lesson.science_lesson_blocks || []);
    const quizzes = lessons.flatMap((lesson) => lesson.science_quizzes || []);
    return {
      lessons: lessons.length,
      blocks: blocks.length,
      quizzes: quizzes.length,
      simulations: blocks.filter((block) => block.block_type === 'simulation_embed').length,
      practice: blocks.filter((block) => block.block_type === 'exercise').length,
      required: lessons.filter((lesson) => lesson.is_required !== false).length,
    };
  }, [modules]);

  const firstLesson = modules.flatMap((module) =>
    (module.science_lessons || []).map((lesson) => ({ module, lesson }))
  )[0];

  const handleEnroll = async () => {
    if (demoMode) {
      setEnrolled(true);
      return;
    }
    if (!user) {
      router.push(`/login?from=${encodeURIComponent(`/science-tech/courses/${courseSlug}`)}`);
      return;
    }
    setIsEnrolling(true);
    setError('');
    try {
      await enrollInScienceCourse(course.id);
      setEnrolled(true);
    } catch (enrollError) {
      console.error('Error enrolling in Science v2 course:', enrollError);
      setError(getScienceErrorMessage(enrollError, t('science.enrollError')));
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 text-center text-gray-400">{t('science.loadingCourse')}</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 px-4 text-center">
          <p className="text-red-300">{error || t('science.courseNotFound')}</p>
          <Link href="/science-tech" className="text-red-400 hover:text-red-300 mt-4 inline-block">{t('science.backToScience')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-gray-200">
      <div className="pb-12">
        <section className="border-b border-gray-800 bg-black/35">
          <div className="container mx-auto max-w-7xl px-4 py-7">
            <Link href="/science-tech" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-5">
              <ArrowLeft className="w-4 h-4" />
              {t('science.scienceCatalog')}
            </Link>

            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <StatusChip tone="red">{course.science_subjects?.name || t('science.science')}</StatusChip>
                  <StatusChip>{levelLabel[course.level] ? t(levelLabel[course.level]) : course.level}</StatusChip>
                  {demoMode && <StatusChip tone="yellow">{t('science.localDemo')}</StatusChip>}
                  {course.certificate_available && <StatusChip tone="yellow">{t('science.certificateAvailable')}</StatusChip>}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white">{course.title}</h1>
                {course.subtitle && <p className="text-xl text-gray-300 mt-2">{course.subtitle}</p>}
                {course.description && <p className="text-gray-400 mt-4 max-w-4xl leading-relaxed">{course.description}</p>}
              </div>

              <aside className="border border-gray-800 bg-black/30 p-4 h-fit">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label={t('science.modules')} value={modules.length} icon={Layers} />
                  <Metric label={t('science.lessons')} value={stats.lessons} icon={BookOpen} />
                  <Metric label={t('science.time')} value={minutesToLabel(t, course.estimated_minutes)} icon={Clock} />
                  <Metric label={t('science.checks')} value={stats.quizzes} icon={HelpCircle} />
                </div>
                <div className="mt-4">
                  {enrolled && firstLesson ? (
                    <Link href={`/science-tech/courses/${course.slug}/${firstLesson.module.slug}/${firstLesson.lesson.slug}`} className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3">
                      {t('science.continueStudy')} <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button type="button" onClick={handleEnroll} disabled={isEnrolling} className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 disabled:opacity-50">
                      {isEnrolling ? t('science.enrolling') : t('science.enrollAndStart')}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-4 py-8 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <Panel title={t('science.syllabus')}>
              <div className="border border-gray-800 bg-black/30 overflow-hidden">
                <div className="hidden md:grid grid-cols-[54px_1fr_90px_90px_130px] gap-3 px-4 py-2 bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-600">
                  <span>{t('science.numberShort')}</span>
                  <span>{t('science.module')}</span>
                  <span>{t('science.lessons')}</span>
                  <span>{t('science.blocks')}</span>
                  <span>{t('science.activity')}</span>
                </div>
                {modules.length === 0 ? (
                  <p className="p-5 text-gray-600">{t('science.noModules')}</p>
                ) : modules.map((module, moduleIndex) => {
                  const isOpen = expanded[module.id];
                  const lessons = module.science_lessons || [];
                  const moduleBlocks = lessons.flatMap((lesson) => lesson.science_lesson_blocks || []);
                  const moduleQuizzes = lessons.flatMap((lesson) => lesson.science_quizzes || []);
                  return (
                    <div key={module.id} className="border-b border-gray-800 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setExpanded((value) => ({ ...value, [module.id]: !value[module.id] }))}
                        className="w-full grid md:grid-cols-[54px_1fr_90px_90px_130px] gap-3 px-4 py-4 text-left hover:bg-red-950/10"
                      >
                        <span className="text-gray-600 font-mono">{String(moduleIndex + 1).padStart(2, '0')}</span>
                        <span>
                          <span className="block text-white font-semibold">{module.title}</span>
                          {module.description && <span className="block text-gray-500 text-sm mt-1 line-clamp-1">{module.description}</span>}
                        </span>
                        <span className="text-sm text-gray-400">{lessons.length}</span>
                        <span className="text-sm text-gray-400">{moduleBlocks.length}</span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="flex gap-1">
                            {moduleBlocks.some((block) => block.block_type === 'exercise') && <StatusChip>{t('science.practice')}</StatusChip>}
                            {moduleBlocks.some((block) => block.block_type === 'simulation_embed') && <StatusChip>{t('science.lab')}</StatusChip>}
                            {moduleQuizzes.length > 0 && <StatusChip>{t('science.quiz')}</StatusChip>}
                          </span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="bg-black/20 border-t border-gray-800">
                          {lessons.length === 0 ? (
                            <p className="px-4 py-3 text-gray-600">{t('science.noLessons')}</p>
                          ) : lessons.map((lesson, lessonIndex) => {
                            const Icon = lessonKindIcon[lesson.lesson_kind] || BookOpen;
                            const locked = !enrolled && lessonIndex > 0;
                            const target = `/science-tech/courses/${course.slug}/${module.slug}/${lesson.slug}`;
                            return (
                              <Link
                                key={lesson.id}
                                href={locked ? '#' : target}
                                onClick={(event) => {
                                  if (locked) {
                                    event.preventDefault();
                                    handleEnroll();
                                  }
                                }}
                                className={`grid md:grid-cols-[54px_1fr_90px_90px_36px] gap-3 px-4 py-3 border-b border-gray-800/60 last:border-b-0 hover:bg-black/30 ${locked ? 'opacity-60' : ''}`}
                              >
                                <span className="text-gray-700 font-mono">{moduleIndex + 1}.{lessonIndex + 1}</span>
                                <span className="min-w-0">
                                  <span className="flex items-center gap-2 text-gray-200 text-sm font-medium">
                                    {locked ? <Lock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5 text-gray-500" />}
                                    {lesson.title}
                                  </span>
                                  {lesson.summary && <span className="block text-gray-600 text-xs mt-1 line-clamp-1">{lesson.summary}</span>}
                                </span>
                                <span className="text-gray-500 text-sm">{minutesToLabel(t, lesson.estimated_minutes)}</span>
                                <span className="text-gray-500 text-sm">{t('science.blockCount', { count: lesson.science_lesson_blocks?.length || 0 })}</span>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            {course.outcomes?.length > 0 && (
              <Panel title={t('science.learningObjectives')}>
                <ul className="space-y-3">
                  {course.outcomes.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2 text-gray-300 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title={t('science.prerequisites')}>
              {course.prerequisites?.length > 0 ? (
                <ul className="space-y-2">
                  {course.prerequisites.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2 text-gray-400 text-sm">
                      <Lock className="w-3.5 h-3.5 mt-0.5 text-gray-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 text-sm">{t('science.noPrerequisites')}</p>
              )}
            </Panel>

            <Panel title={t('science.assessmentResources')}>
              <div className="grid grid-cols-2 gap-3">
                <Metric label={t('science.practice')} value={stats.practice} icon={Target} />
                <Metric label={t('science.labs')} value={stats.simulations} icon={FlaskConical} />
                <Metric label={t('science.required')} value={stats.required} icon={FileText} />
                <Metric label={t('science.certificate')} value={course.certificate_available ? t('common.yes') : t('common.no')} icon={Award} />
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
};

const StatusChip = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'border-gray-700 text-gray-400 bg-black/30',
    red: 'border-red-900/50 text-red-300 bg-red-950/20',
    yellow: 'border-yellow-900/50 text-yellow-400 bg-yellow-950/10',
  };
  return <span className={`inline-flex items-center px-2 py-1 text-xs border ${tones[tone] || tones.neutral}`}>{children}</span>;
};

const Metric = ({ label, value, icon: Icon }) => (
  <div className="border border-gray-800 bg-black/30 p-3">
    <div className="flex items-center gap-2 text-gray-600">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[11px] uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-white font-semibold mt-1">{value}</p>
  </div>
);

const Panel = ({ title, children }) => (
  <div>
    <h2 className="text-white font-semibold mb-3">{title}</h2>
    <div className="border border-gray-800 bg-black/30 p-4">{children}</div>
  </div>
);

export default CoursePage;
