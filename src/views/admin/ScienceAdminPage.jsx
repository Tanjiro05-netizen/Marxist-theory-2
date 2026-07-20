import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ScienceBlockRenderer from '../../components/ScienceTechV2/ScienceBlockRenderer';
import {
  createScienceCourseFromImport,
  deleteScienceRecord,
  fetchScienceAdminCourse,
  fetchScienceAdminData,
  fetchScienceQuestions,
  fetchScienceQuizzes,
  getScienceErrorMessage,
  saveScienceBlock,
  saveScienceCourse,
  saveScienceLesson,
  saveScienceModule,
  saveScienceQuestion,
  saveScienceQuiz,
  saveScienceQuizQuestion,
} from '../../services/scienceApi';
import { parseScienceMarkdown, SCIENCE_IMPORT_SAMPLE, scienceSlugify } from '../../utils/scienceMarkdownImporter';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Atom,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Code2,
  Cog,
  Copy,
  Dna,
  FileInput,
  FileText,
  FlaskConical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ListChecks,
  Search,
  Sigma,
  Target,
  Pencil,
  Plus,
  Save,
  Trash2,
  Type,
  Video,
  XCircle,
} from 'lucide-react';

const tabs = [
  { id: 'courses', label: 'Course Setup', icon: BookOpen },
  { id: 'outline', label: 'Outline Builder', icon: Layers },
  { id: 'blocks', label: 'Block Builder', icon: FlaskConical },
  { id: 'questions', label: 'Question Bank', icon: HelpCircle },
  { id: 'quizzes', label: 'Quiz Builder', icon: ClipboardList },
  { id: 'importer', label: 'Importer', icon: FileInput },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
];

const blockTypes = [
  'rich_text',
  'math',
  'worked_example',
  'video',
  'simulation_embed',
  'exercise',
  'quiz',
  'callout',
  'image',
];

const subjectIconMap = {
  physics: Atom,
  mathematics: Sigma,
  'computer-science': Code2,
  chemistry: FlaskConical,
  'biology-medicine': Dna,
  engineering: Cog,
};

const blockTypeMeta = {
  rich_text: {
    label: 'Reading',
    description: 'Markdown, tables, code notes, citations, and long-form explanation.',
    icon: FileText,
  },
  math: {
    label: 'Equation / derivation',
    description: 'KaTeX-ready math notes, definitions, proofs, and symbolic steps.',
    icon: Sigma,
  },
  worked_example: {
    label: 'Worked example',
    description: 'Problem statement with revealable solution steps and final answer.',
    icon: Calculator,
  },
  video: {
    label: 'Lecture media',
    description: 'Video URL, transcript, caption, and lesson placement.',
    icon: Video,
  },
  simulation_embed: {
    label: 'Simulation lab',
    description: 'Embedded interactive lab with prompts, variables, and tasks.',
    icon: FlaskConical,
  },
  exercise: {
    label: 'Inline exercise',
    description: 'Connect a reusable question from the bank to the lesson flow.',
    icon: Target,
  },
  quiz: {
    label: 'Checkpoint',
    description: 'Link a quiz checkpoint assembled from the question bank.',
    icon: ClipboardList,
  },
  callout: {
    label: 'Academic note',
    description: 'Definition, theorem, warning, common mistake, or historical note.',
    icon: Type,
  },
  image: {
    label: 'Diagram',
    description: 'Figure, caption, and alt text for diagrams or reference images.',
    icon: ImageIcon,
  },
};

const simulationLabTemplates = [
  {
    title: 'Mechanics investigation',
    caption: 'Force, mass, acceleration, and motion graph observation.',
    prompt: 'Use the lab to test how changing one physical quantity affects the system while holding the others stable.',
    setup: 'Define the starting state, record the controlled variables, then run at least two comparison trials.',
    variablesText: 'mass\nforce\nacceleration\ninitial velocity',
    tasksText: 'Predict the motion before running the lab\nChange one variable and record the result\nExplain the observed relation using the lesson concept',
    observationsText: 'Which quantity changed most visibly?\nWhere did the prediction fail?\nWhat equation or diagram explains the result?',
  },
  {
    title: 'Graphing and model lab',
    caption: 'Function behavior, parameter changes, and graphical interpretation.',
    prompt: 'Manipulate the model parameters and connect the visual change to the formal expression.',
    setup: 'Start with the base expression, change one parameter at a time, and compare the graph before and after.',
    variablesText: 'coefficient\nconstant term\nindependent variable\nscale',
    tasksText: 'Sketch the expected graph\nAdjust one parameter\nDescribe the transformation in words and notation',
    observationsText: 'What stayed invariant?\nWhat changed continuously?\nWhat is the limiting case?',
  },
  {
    title: 'Systems and fields lab',
    caption: 'Flows, fields, networks, or interacting components.',
    prompt: 'Observe how local changes affect the whole system and identify stable or unstable behavior.',
    setup: 'Choose a baseline configuration, document the field or system state, then introduce a controlled disturbance.',
    variablesText: 'source strength\nboundary condition\ninteraction range\ntime step',
    tasksText: 'Map the initial state\nIntroduce one disturbance\nIdentify equilibrium, feedback, or propagation patterns',
    observationsText: 'Where does the system stabilize?\nWhere does it amplify change?\nWhich diagram best represents the result?',
  },
];

const emptyCourseForm = {
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  subject_id: '',
  level: 'beginner',
  estimated_minutes: '',
  language: 'en',
  thumbnail_url: '',
  outcomesText: '',
  prerequisitesText: '',
  status: 'draft',
  certificate_available: true,
};

const emptyModuleForm = {
  title: '',
  slug: '',
  description: '',
  order_index: 0,
  is_published: true,
};

const emptyLessonForm = {
  title: '',
  slug: '',
  summary: '',
  lesson_kind: 'concept',
  estimated_minutes: '',
  xp_reward: 10,
  order_index: 0,
  is_published: true,
};

const emptyBlockDraft = {
  block_type: 'rich_text',
  title: '',
  body: '',
  url: '',
  caption: '',
  alt: '',
  variant: 'intuition',
  prompt: '',
  setup: '',
  variablesText: '',
  tasksText: '',
  observationsText: '',
  problem: '',
  stepsText: '',
  answer: '',
  transcript: '',
  question_id: '',
  quiz_id: '',
  order_index: 0,
};

const emptyQuestionDraft = {
  question_type: 'multiple_choice',
  prompt: '',
  optionsText: 'Option A\nOption B\nOption C',
  correct_answer: '',
  tolerance: '',
  explanation: '',
  hint: '',
  difficulty: 'beginner',
  tagsText: '',
  subject_id: '',
};

const emptyQuizDraft = {
  title: '',
  description: '',
  module_id: '',
  lesson_id: '',
  passing_score: 70,
  attempts_allowed: '',
  feedback_mode: 'after_submit',
  is_published: true,
};

const splitLines = (text) => `${text || ''}`.split('\n').map((item) => item.trim()).filter(Boolean);

const minutesToHours = (minutes) => {
  if (!minutes) return '';
  const hours = Number(minutes) / 60;
  return Number.isInteger(hours) ? `${hours}` : `${hours.toFixed(1)}`;
};

const hoursToMinutes = (hours) => {
  if (!hours) return '';
  return Math.round(Number(hours) * 60);
};

const courseToForm = (course) => ({
  ...emptyCourseForm,
  ...course,
  subject_id: course?.subject_id || '',
  estimated_minutes: minutesToHours(course?.estimated_minutes),
  outcomesText: (course?.outcomes || []).join('\n'),
  prerequisitesText: (course?.prerequisites || []).join('\n'),
  certificate_available: course?.certificate_available !== false,
});

const createBlockContent = (draft) => {
  if (draft.block_type === 'worked_example') {
    return { problem: draft.problem || draft.body, steps: splitLines(draft.stepsText), answer: draft.answer };
  }
  if (draft.block_type === 'video') {
    return { url: draft.url, transcript: draft.transcript, duration: draft.duration || null };
  }
  if (draft.block_type === 'simulation_embed') {
    return {
      url: draft.url,
      caption: draft.caption,
      prompt: draft.prompt,
      setup: draft.setup,
      variables: splitLines(draft.variablesText),
      tasks: splitLines(draft.tasksText),
      observations: splitLines(draft.observationsText),
    };
  }
  if (draft.block_type === 'exercise') {
    return { question_id: draft.question_id };
  }
  if (draft.block_type === 'quiz') {
    return { quiz_id: draft.quiz_id };
  }
  if (draft.block_type === 'callout') {
    return { body: draft.body, variant: draft.variant };
  }
  if (draft.block_type === 'image') {
    return { url: draft.url, caption: draft.caption, alt: draft.alt };
  }
  return { body: draft.body };
};

const blockToDraft = (block) => {
  const content = block?.content_json || {};
  return {
    ...emptyBlockDraft,
    id: block.id,
    block_type: block.block_type,
    title: block.title || '',
    body: content.body || '',
    url: content.url || '',
    caption: content.caption || '',
    alt: content.alt || '',
    variant: content.variant || 'intuition',
    prompt: content.prompt || '',
    setup: content.setup || '',
    variablesText: (content.variables || []).join('\n'),
    tasksText: (content.tasks || []).join('\n'),
    observationsText: (content.observations || []).join('\n'),
    problem: content.problem || '',
    stepsText: (content.steps || []).join('\n'),
    answer: content.answer || '',
    transcript: content.transcript || '',
    question_id: content.question_id || '',
    quiz_id: content.quiz_id || '',
    order_index: block.order_index || 0,
  };
};

const hasBlockContent = (block) => {
  const content = block.content_json || {};
  return Boolean(
    content.body ||
    content.url ||
    content.question_id ||
    content.quiz_id ||
    content.problem ||
    content.answer ||
    (content.steps || []).length
  );
};

const ScienceAdminPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [outline, setOutline] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [blockDraft, setBlockDraft] = useState(emptyBlockDraft);
  const [questionDraft, setQuestionDraft] = useState(emptyQuestionDraft);
  const [quizDraft, setQuizDraft] = useState(emptyQuizDraft);
  const [attachQuestionId, setAttachQuestionId] = useState('');
  const [attachQuizId, setAttachQuizId] = useState('');
  const [importText, setImportText] = useState(SCIENCE_IMPORT_SAMPLE);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedModule = outline.find((module) => module.id === selectedModuleId) || outline[0] || null;
  const lessons = selectedModule?.science_lessons || [];
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0] || null;
  const selectedBlocks = selectedLesson?.science_lesson_blocks || [];
  const parsedImport = useMemo(() => parseScienceMarkdown(importText), [importText]);
  const selectedSubject = subjects.find((subject) => subject.id === courseForm.subject_id) || null;

  const questionsById = useMemo(() => {
    const lookup = {};
    questions.forEach((question) => {
      lookup[question.id] = question;
    });
    return lookup;
  }, [questions]);

  const loadAdminData = useCallback(async (preferredCourseId = '') => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchScienceAdminData();
      setSubjects(data.subjects);
      setCourses(data.courses);
      const nextCourseId = preferredCourseId || data.courses[0]?.id || '';
      setSelectedCourseId(nextCourseId);
      if (nextCourseId) {
        const detail = await fetchScienceAdminCourse(nextCourseId);
        const [questionData, quizData] = await Promise.all([
          fetchScienceQuestions(),
          fetchScienceQuizzes({ courseId: nextCourseId }),
        ]);
        setOutline(detail);
        setQuestions(questionData);
        setQuizzes(quizData);
        setSelectedModuleId((current) => current || detail[0]?.id || '');
        setSelectedLessonId((current) => current || detail[0]?.science_lessons?.[0]?.id || '');
      } else {
        setOutline([]);
        setQuestions([]);
        setQuizzes([]);
      }
    } catch (loadError) {
      console.error('Error loading Science Creator Studio:', loadError);
      setError(getScienceErrorMessage(loadError, 'Could not load Science Creator Studio.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData('');
  }, [loadAdminData]);

  useEffect(() => {
    if (!selectedCourse) {
      setCourseForm(emptyCourseForm);
      return;
    }
    setCourseForm(courseToForm(selectedCourse));
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedModule && !selectedLessonId) {
      setSelectedLessonId(selectedModule.science_lessons?.[0]?.id || '');
    }
  }, [selectedLessonId, selectedModule]);

  const runSave = async (action, successMessage) => {
    setIsSaving(true);
    setError('');
    setStatus('');
    try {
      const result = await action();
      setStatus(successMessage);
      return result;
    } catch (saveError) {
      console.error('Science Creator Studio save error:', saveError);
      setError(getScienceErrorMessage(saveError, 'Save failed.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const chooseBlockType = (blockType) => {
    setBlockDraft({ ...emptyBlockDraft, block_type: blockType });
  };

  const applySimulationTemplate = (template) => {
    setBlockDraft({
      ...emptyBlockDraft,
      block_type: 'simulation_embed',
      title: template.title,
      caption: template.caption,
      prompt: template.prompt,
      setup: template.setup,
      variablesText: template.variablesText,
      tasksText: template.tasksText,
      observationsText: template.observationsText,
    });
  };

  const saveCourse = async () => {
    const saved = await runSave(async () => saveScienceCourse({
      ...courseForm,
      id: courseForm.id,
      slug: courseForm.slug || scienceSlugify(courseForm.title),
      estimated_minutes: hoursToMinutes(courseForm.estimated_minutes),
      outcomes: splitLines(courseForm.outcomesText),
      prerequisites: splitLines(courseForm.prerequisitesText),
    }), 'Course saved.');
    if (saved) {
      await loadAdminData(saved.id);
      setSelectedCourseId(saved.id);
    }
  };

  const saveModule = async () => {
    if (!selectedCourseId) return;
    const saved = await runSave(async () => saveScienceModule({
      ...moduleForm,
      course_id: selectedCourseId,
      order_index: moduleForm.id ? moduleForm.order_index : outline.length,
    }), 'Module saved.');
    if (saved) {
      setModuleForm(emptyModuleForm);
      await loadAdminData(selectedCourseId);
      setSelectedModuleId(saved.id);
    }
  };

  const saveLesson = async () => {
    if (!selectedModule) return;
    const saved = await runSave(async () => saveScienceLesson({
      ...lessonForm,
      module_id: selectedModule.id,
      order_index: lessonForm.id ? lessonForm.order_index : lessons.length,
    }), 'Lesson saved.');
    if (saved) {
      setLessonForm(emptyLessonForm);
      await loadAdminData(selectedCourseId);
      setSelectedLessonId(saved.id);
    }
  };

  const saveBlock = async () => {
    if (!selectedLesson) return;
    const saved = await runSave(async () => saveScienceBlock({
      id: blockDraft.id,
      lesson_id: selectedLesson.id,
      block_type: blockDraft.block_type,
      title: blockDraft.title,
      content_json: createBlockContent(blockDraft),
      config_json: {},
      order_index: blockDraft.id ? blockDraft.order_index : selectedBlocks.length,
    }), 'Block saved.');
    if (saved) {
      setBlockDraft(emptyBlockDraft);
      await loadAdminData(selectedCourseId);
    }
  };

  const saveQuestion = async () => {
    const saved = await runSave(async () => saveScienceQuestion({
      ...questionDraft,
      subject_id: questionDraft.subject_id || selectedCourse?.subject_id || null,
      options: questionDraft.question_type === 'multiple_choice' ? splitLines(questionDraft.optionsText) : null,
      tags: splitLines(questionDraft.tagsText),
    }), 'Question saved.');
    if (saved) {
      setQuestionDraft(emptyQuestionDraft);
      setQuestions(await fetchScienceQuestions());
    }
  };

  const saveQuiz = async () => {
    if (!selectedCourseId) return;
    const saved = await runSave(async () => saveScienceQuiz({
      ...quizDraft,
      course_id: selectedCourseId,
      module_id: quizDraft.lesson_id ? null : quizDraft.module_id || selectedModule?.id || null,
      lesson_id: quizDraft.lesson_id || null,
    }), 'Quiz saved.');
    if (saved) {
      setQuizDraft(emptyQuizDraft);
      setAttachQuizId(saved.id);
      setQuizzes(await fetchScienceQuizzes({ courseId: selectedCourseId }));
    }
  };

  const attachQuestionToQuiz = async () => {
    if (!attachQuizId || !attachQuestionId) return;
    const quiz = quizzes.find((item) => item.id === attachQuizId);
    const saved = await runSave(async () => saveScienceQuizQuestion({
      quiz_id: attachQuizId,
      question_id: attachQuestionId,
      order_index: quiz?.science_quiz_questions?.length || 0,
      points: 1,
    }), 'Question attached to quiz.');
    if (saved) {
      setAttachQuestionId('');
      setQuizzes(await fetchScienceQuizzes({ courseId: selectedCourseId }));
    }
  };

  const duplicateBlock = async (block) => {
    const saved = await runSave(async () => saveScienceBlock({
      lesson_id: block.lesson_id,
      block_type: block.block_type,
      title: block.title ? `${block.title} copy` : '',
      content_json: block.content_json,
      config_json: block.config_json,
      order_index: selectedBlocks.length,
    }), 'Block duplicated.');
    if (saved) await loadAdminData(selectedCourseId);
  };

  const removeRecord = async (table, id, message) => {
    const deleted = await runSave(async () => {
      await deleteScienceRecord(table, id);
      return true;
    }, message);
    if (deleted) await loadAdminData(selectedCourseId);
  };

  const moveModule = async (module, direction) => {
    const sorted = [...outline].sort((a, b) => a.order_index - b.order_index);
    const index = sorted.findIndex((item) => item.id === module.id);
    const target = sorted[index + direction];
    if (!target) return;
    await runSave(async () => {
      await saveScienceModule({ ...module, order_index: target.order_index });
      await saveScienceModule({ ...target, order_index: module.order_index });
      return true;
    }, 'Module reordered.');
    await loadAdminData(selectedCourseId);
  };

  const moveLesson = async (lesson, direction) => {
    const sorted = [...lessons].sort((a, b) => a.order_index - b.order_index);
    const index = sorted.findIndex((item) => item.id === lesson.id);
    const target = sorted[index + direction];
    if (!target) return;
    await runSave(async () => {
      await saveScienceLesson({ ...lesson, order_index: target.order_index });
      await saveScienceLesson({ ...target, order_index: lesson.order_index });
      return true;
    }, 'Lesson reordered.');
    await loadAdminData(selectedCourseId);
  };

  const moveBlock = async (block, direction) => {
    const sorted = [...selectedBlocks].sort((a, b) => a.order_index - b.order_index);
    const index = sorted.findIndex((item) => item.id === block.id);
    const target = sorted[index + direction];
    if (!target) return;
    await runSave(async () => {
      await saveScienceBlock({ ...block, order_index: target.order_index });
      await saveScienceBlock({ ...target, order_index: block.order_index });
      return true;
    }, 'Block reordered.');
    await loadAdminData(selectedCourseId);
  };

  const importCourse = async () => {
    const saved = await runSave(async () => createScienceCourseFromImport(parsedImport, subjects), 'Imported draft course.');
    if (saved) {
      await loadAdminData(saved.id);
      setSelectedCourseId(saved.id);
      setActiveTab('outline');
    }
  };

  const checklist = useMemo(() => {
    const allLessons = outline.flatMap((module) => module.science_lessons || []);
    const allBlocks = allLessons.flatMap((lesson) => lesson.science_lesson_blocks || []);
    return [
      { label: 'Course has title, description, and outcomes', ok: Boolean(selectedCourse?.title && selectedCourse?.description && selectedCourse?.outcomes?.length) },
      { label: 'Course has at least one module', ok: outline.length > 0 },
      { label: 'Every module has at least one lesson', ok: outline.length > 0 && outline.every((module) => (module.science_lessons || []).length > 0) },
      { label: 'Every lesson has content blocks', ok: allLessons.length > 0 && allLessons.every((lesson) => (lesson.science_lesson_blocks || []).length > 0) },
      { label: 'No empty lesson blocks', ok: allBlocks.every(hasBlockContent) },
      { label: 'Videos and simulations have URLs', ok: allBlocks.filter((block) => ['video', 'simulation_embed'].includes(block.block_type)).every((block) => block.content_json?.url) },
      { label: 'Questions have answers', ok: questions.every((question) => question.prompt && question.correct_answer) },
      { label: 'Published courses do not contain draft lessons', ok: selectedCourse?.status !== 'published' || allLessons.every((lesson) => lesson.is_published) },
    ];
  }, [outline, questions, selectedCourse]);

  const studioStats = useMemo(() => {
    const allLessons = outline.flatMap((module) => module.science_lessons || []);
    const allBlocks = allLessons.flatMap((lesson) => lesson.science_lesson_blocks || []);
    const readyItems = checklist.filter((item) => item.ok).length;
    return {
      courses: courses.length,
      modules: outline.length,
      lessons: allLessons.length,
      blocks: allBlocks.length,
      questions: questions.length,
      quizzes: quizzes.length,
      readiness: checklist.length ? Math.round((readyItems / checklist.length) * 100) : 0,
    };
  }, [checklist, courses.length, outline, questions.length, quizzes.length]);

  if (isLoading) {
    return <div className="px-4 py-12 text-center text-gray-400">Loading Science Creator Studio...</div>;
  }

  return (
    <div className="min-h-screen bg-[#12131A]">
      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgb(55 65 81);
          background: rgba(0, 0, 0, 0.45);
          color: white;
          padding: 0.625rem 0.75rem;
          outline: none;
        }
        .input:focus { border-color: rgb(239 68 68); }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgb(220 38 38);
          color: white;
          font-weight: 600;
          padding: 0.625rem 1rem;
        }
        .btn-primary:hover { background: rgb(185 28 28); }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: 1px solid rgb(31 41 55);
          color: rgb(156 163 175);
          background: rgba(0, 0, 0, 0.25);
        }
        .icon-btn:hover {
          border-color: rgb(75 85 99);
          color: white;
        }
        .choice-tile {
          border: 1px solid rgb(31 41 55);
          background: rgba(0, 0, 0, 0.28);
          padding: 0.75rem;
          text-align: left;
          transition: border-color 120ms ease, background 120ms ease;
        }
        .choice-tile:hover {
          border-color: rgb(75 85 99);
          background: rgba(0, 0, 0, 0.42);
        }
        .choice-tile-active {
          border-color: rgba(220, 38, 38, 0.75);
          background: rgba(127, 29, 29, 0.18);
        }
        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border: 1px solid rgb(31 41 55);
          background: rgba(0, 0, 0, 0.35);
          color: rgb(156 163 175);
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          line-height: 1rem;
        }
      `}</style>
      <div className="border-b border-gray-800 bg-black/40">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-red-500 text-sm font-semibold uppercase tracking-wide">Science & Technology V2</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">Creator Studio</h1>
              <p className="text-gray-500 mt-2 max-w-3xl">
                Course shell, syllabus, lesson blocks, question bank, checkpoints, import validation, and publishing readiness.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 min-w-full lg:min-w-[520px]">
              <StudioMetric label="Modules" value={studioStats.modules} icon={Layers} />
              <StudioMetric label="Lessons" value={studioStats.lessons} icon={BookOpen} />
              <StudioMetric label="Blocks" value={studioStats.blocks} icon={FlaskConical} />
              <StudioMetric label="Ready" value={`${studioStats.readiness}%`} icon={CheckCircle2} />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap border px-3 py-2 text-sm ${activeTab === tab.id ? 'border-red-800 bg-red-950/30 text-white' : 'border-gray-800 bg-black/30 text-gray-500 hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {(status || error) && (
          <div className={`mt-4 border p-3 text-sm ${error ? 'border-red-900/40 bg-red-950/20 text-red-200' : 'border-green-900/40 bg-green-950/20 text-green-200'}`}>
            {error || status}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]">
          <aside className="space-y-4">
            <div className="border border-gray-800 bg-black/30 p-4">
              <h2 className="text-white font-semibold mb-3">Course Registry</h2>
              <select
                value={selectedCourseId}
                onChange={async (event) => {
                  setSelectedCourseId(event.target.value);
                  setSelectedModuleId('');
                  setSelectedLessonId('');
                  await loadAdminData(event.target.value);
                }}
                className="input mb-3"
              >
                <option value="">New course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <div className="max-h-[280px] overflow-y-auto border border-gray-800">
                {courses.length === 0 ? (
                  <p className="p-3 text-gray-600 text-sm">No courses yet.</p>
                ) : courses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={async () => {
                      setSelectedCourseId(course.id);
                      setSelectedModuleId('');
                      setSelectedLessonId('');
                      await loadAdminData(course.id);
                    }}
                    className={`w-full text-left px-3 py-2 border-b border-gray-800 last:border-b-0 text-sm hover:bg-black/40 ${selectedCourseId === course.id ? 'bg-red-950/20 text-white' : 'text-gray-500'}`}
                  >
                    <span className="block truncate">{course.title}</span>
                    <span className="text-xs text-gray-700">{course.status}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-800 bg-black/30 p-4">
              <h2 className="text-white font-semibold mb-3">Course Tree</h2>
              {outline.length === 0 ? (
                <p className="text-gray-600 text-sm">No modules yet.</p>
              ) : (
                <div className="space-y-3 max-h-[52vh] overflow-y-auto">
                  {outline.map((module, moduleIndex) => (
                    <div key={module.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedModuleId(module.id)}
                        className={`w-full text-left text-sm font-medium ${selectedModuleId === module.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {String(moduleIndex + 1).padStart(2, '0')} {module.title}
                      </button>
                      <div className="mt-1 ml-4 space-y-1 border-l border-gray-800 pl-3">
                        {(module.science_lessons || []).map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(lesson.id); setActiveTab('blocks'); }}
                            className={`block w-full text-left text-xs truncate ${selectedLessonId === lesson.id ? 'text-red-300' : 'text-gray-600 hover:text-gray-300'}`}
                          >
                            {lesson.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="min-w-0">
        {activeTab === 'courses' && (
          <section className="mt-6 space-y-6">
            <div className="border border-gray-800 bg-black/35 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Course Production Board</h2>
                  <p className="mt-1 text-sm text-gray-500">Build the academic shell before adding modules, labs, exercises, and checkpoints.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="status-chip">1. Discipline</span>
                  <span className="status-chip">2. Course shell</span>
                  <span className="status-chip">3. Learning contract</span>
                  <span className="status-chip">4. Publish state</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <div className="border border-gray-800 bg-black/35 p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-white font-semibold">Choose Course Subject</h2>
                      <p className="text-sm text-gray-500">This controls catalog grouping, question-bank defaults, and the learner syllabus label.</p>
                    </div>
                    {selectedSubject && <span className="status-chip text-white">{selectedSubject.name}</span>}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {subjects.map((subject) => {
                      const Icon = subjectIconMap[subject.slug] || BookOpen;
                      const active = courseForm.subject_id === subject.id;
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, subject_id: subject.id })}
                          className={`choice-tile ${active ? 'choice-tile-active' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center border border-gray-800 bg-black/40"
                              style={{ color: subject.color || '#ef4444' }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white">{subject.name}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{subject.description || 'Subject archive and course group.'}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {subjects.length === 0 && <p className="text-sm text-yellow-200">No subjects found. Apply the Science v2 subject seed migration first.</p>}
                </div>

                <div className="border border-gray-800 bg-black/35 p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-white font-semibold">Course Shell</h2>
                      <p className="text-sm text-gray-500">Identity, catalog metadata, duration, and publication state.</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedCourseId(''); setCourseForm(emptyCourseForm); setOutline([]); }} className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
                      <Plus className="h-4 w-4" />
                      New shell
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Title"><input value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value, slug: courseForm.slug || scienceSlugify(event.target.value) })} className="input" /></Field>
                    <Field label="Slug"><input value={courseForm.slug} onChange={(event) => setCourseForm({ ...courseForm, slug: event.target.value })} className="input" /></Field>
                    <Field label="Subtitle"><input value={courseForm.subtitle || ''} onChange={(event) => setCourseForm({ ...courseForm, subtitle: event.target.value })} className="input" /></Field>
                    <Field label="Thumbnail URL"><input value={courseForm.thumbnail_url || ''} onChange={(event) => setCourseForm({ ...courseForm, thumbnail_url: event.target.value })} className="input" /></Field>
                    <Field label="Level">
                      <div className="grid grid-cols-3 gap-2">
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setCourseForm({ ...courseForm, level })}
                            className={`border px-3 py-2 text-sm capitalize ${courseForm.level === level ? 'border-red-800 bg-red-950/25 text-white' : 'border-gray-800 bg-black/30 text-gray-500 hover:text-white'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Estimated Hours"><input type="number" min="0" step="0.5" value={courseForm.estimated_minutes || ''} onChange={(event) => setCourseForm({ ...courseForm, estimated_minutes: event.target.value })} className="input" /></Field>
                    <Field label="Language"><input value={courseForm.language || 'en'} onChange={(event) => setCourseForm({ ...courseForm, language: event.target.value })} className="input" /></Field>
                    <Field label="Publication State">
                      <select value={courseForm.status} onChange={(event) => setCourseForm({ ...courseForm, status: event.target.value })} className="input">
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="border border-gray-800 bg-black/35 p-5">
                  <h2 className="text-white font-semibold">Learning Contract</h2>
                  <p className="mb-4 mt-1 text-sm text-gray-500">The syllabus promise learners see before entering the course.</p>
                  <Field label="Course Overview"><textarea value={courseForm.description || ''} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} rows={5} className="input" /></Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Outcomes / What Learners Will Be Able To Do"><textarea value={courseForm.outcomesText || ''} onChange={(event) => setCourseForm({ ...courseForm, outcomesText: event.target.value })} rows={6} className="input" /></Field>
                    <Field label="Prerequisites / Required Background"><textarea value={courseForm.prerequisitesText || ''} onChange={(event) => setCourseForm({ ...courseForm, prerequisitesText: event.target.value })} rows={6} className="input" /></Field>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="border border-gray-800 bg-black/35 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-white font-semibold">Course Registry</h2>
                    <Search className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="max-h-[360px] overflow-y-auto border border-gray-800">
                    {courses.length === 0 ? (
                      <p className="p-3 text-sm text-gray-600">No courses yet.</p>
                    ) : courses.map((course) => (
                      <button
                        key={course.id}
                        type="button"
                        onClick={async () => {
                          setSelectedCourseId(course.id);
                          setSelectedModuleId('');
                          setSelectedLessonId('');
                          await loadAdminData(course.id);
                        }}
                        className={`w-full border-b border-gray-800/70 p-3 text-left last:border-b-0 hover:bg-black/40 ${selectedCourseId === course.id ? 'bg-red-950/20' : ''}`}
                      >
                        <p className="truncate text-sm font-medium text-white">{course.title}</p>
                        <p className="mt-1 text-xs text-gray-600">{course.science_subjects?.name || 'No subject'} · {course.status}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-800 bg-black/35 p-4">
                  <h2 className="text-white font-semibold">Shell Readiness</h2>
                  <div className="mt-3 space-y-2 text-sm">
                    <ReadinessLine ok={Boolean(courseForm.subject_id)} label="Subject selected" />
                    <ReadinessLine ok={Boolean(courseForm.title && courseForm.slug)} label="Title and URL slug" />
                    <ReadinessLine ok={Boolean(courseForm.description)} label="Course overview" />
                    <ReadinessLine ok={splitLines(courseForm.outcomesText).length > 0} label="Learning outcomes" />
                    <ReadinessLine ok={Boolean(courseForm.estimated_minutes)} label="Estimated hours" />
                  </div>
                  <label className="mt-4 flex items-center gap-2 border border-gray-800 bg-black/30 p-3 text-sm text-gray-300">
                    <input type="checkbox" checked={courseForm.certificate_available} onChange={(event) => setCourseForm({ ...courseForm, certificate_available: event.target.checked })} />
                    Certificate available after completion
                  </label>
                  <button type="button" onClick={saveCourse} disabled={isSaving || !courseForm.title} className="btn-primary mt-4 w-full">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Course Shell'}
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {activeTab === 'outline' && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="border border-gray-800 bg-black/35">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-white font-semibold">Modules and Lessons</h2>
              </div>
              {outline.length === 0 ? (
                <p className="p-5 text-gray-500">No modules yet.</p>
              ) : outline.map((module) => (
                <div key={module.id} className="border-b border-gray-800/70">
                  <div className="p-4 bg-black/20 flex items-center gap-3">
                    <button type="button" onClick={() => setSelectedModuleId(module.id)} className="flex-1 text-left">
                      <p className="text-white font-medium">{module.title}</p>
                      <p className="text-gray-600 text-sm">{module.science_lessons?.length || 0} lessons</p>
                    </button>
                    <button type="button" onClick={() => moveModule(module, -1)} className="icon-btn"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => moveModule(module, 1)} className="icon-btn"><ArrowDown className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setModuleForm({ ...emptyModuleForm, ...module })} className="icon-btn"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeRecord('science_modules', module.id, 'Module deleted.')} className="icon-btn text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {(module.science_lessons || []).map((lesson) => (
                    <div key={lesson.id} className={`ml-6 p-3 border-l border-gray-800 flex items-center gap-3 ${selectedLessonId === lesson.id ? 'bg-red-950/10' : ''}`}>
                      <button type="button" onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(lesson.id); }} className="flex-1 text-left">
                        <p className="text-gray-200 text-sm font-medium">{lesson.title}</p>
                        <p className="text-gray-600 text-xs">{lesson.science_lesson_blocks?.length || 0} blocks · {lesson.lesson_kind}</p>
                      </button>
                      <button type="button" onClick={() => moveLesson(lesson, -1)} className="icon-btn"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveLesson(lesson, 1)} className="icon-btn"><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setLessonForm({ ...emptyLessonForm, ...lesson })} className="icon-btn"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeRecord('science_lessons', lesson.id, 'Lesson deleted.')} className="icon-btn text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <FormPanel title={moduleForm.id ? 'Edit Module' : 'Add Module'}>
                <Field label="Title"><input value={moduleForm.title} onChange={(event) => setModuleForm({ ...moduleForm, title: event.target.value, slug: moduleForm.slug || scienceSlugify(event.target.value) })} className="input" /></Field>
                <Field label="Slug"><input value={moduleForm.slug || ''} onChange={(event) => setModuleForm({ ...moduleForm, slug: event.target.value })} className="input" /></Field>
                <Field label="Description"><textarea value={moduleForm.description || ''} onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })} rows={3} className="input" /></Field>
                <button type="button" onClick={saveModule} disabled={isSaving || !selectedCourseId || !moduleForm.title} className="btn-primary w-full"><Save className="w-4 h-4" /> Save Module</button>
              </FormPanel>

              <FormPanel title={lessonForm.id ? 'Edit Lesson' : `Add Lesson${selectedModule ? ` to ${selectedModule.title}` : ''}`}>
                <Field label="Title"><input value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value, slug: lessonForm.slug || scienceSlugify(event.target.value) })} className="input" /></Field>
                <Field label="Slug"><input value={lessonForm.slug || ''} onChange={(event) => setLessonForm({ ...lessonForm, slug: event.target.value })} className="input" /></Field>
                <Field label="Kind">
                  <select value={lessonForm.lesson_kind} onChange={(event) => setLessonForm({ ...lessonForm, lesson_kind: event.target.value })} className="input">
                    <option value="concept">Concept</option>
                    <option value="practice">Practice</option>
                    <option value="lab">Lab</option>
                    <option value="quiz">Quiz</option>
                    <option value="project">Project</option>
                    <option value="review">Review</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Minutes"><input type="number" value={lessonForm.estimated_minutes || ''} onChange={(event) => setLessonForm({ ...lessonForm, estimated_minutes: event.target.value })} className="input" /></Field>
                  <Field label="XP"><input type="number" value={lessonForm.xp_reward || ''} onChange={(event) => setLessonForm({ ...lessonForm, xp_reward: event.target.value })} className="input" /></Field>
                </div>
                <Field label="Summary"><textarea value={lessonForm.summary || ''} onChange={(event) => setLessonForm({ ...lessonForm, summary: event.target.value })} rows={3} className="input" /></Field>
                <button type="button" onClick={saveLesson} disabled={isSaving || !selectedModule || !lessonForm.title} className="btn-primary w-full"><Save className="w-4 h-4" /> Save Lesson</button>
              </FormPanel>
            </div>
          </section>
        )}

        {activeTab === 'blocks' && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <div className="border border-gray-800 bg-black/35 p-4 flex flex-wrap items-center gap-3">
                <span className="text-gray-500 text-sm">Lesson</span>
                <select value={selectedModule?.id || ''} onChange={(event) => { setSelectedModuleId(event.target.value); setSelectedLessonId(''); }} className="input max-w-xs">
                  {outline.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                </select>
                <select value={selectedLesson?.id || ''} onChange={(event) => setSelectedLessonId(event.target.value)} className="input max-w-xs">
                  {lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
                </select>
              </div>

              {selectedBlocks.length === 0 ? (
                <div className="border border-gray-800 bg-black/35 p-6 text-gray-500">No blocks yet. Add the first reading, math, lab, exercise, or quiz block.</div>
              ) : selectedBlocks.map((block) => (
                <div key={block.id} className="border border-gray-800 bg-black/35">
                  <div className="p-3 border-b border-gray-800 flex flex-wrap items-center gap-3">
                    <span className="px-2 py-1 bg-gray-900 text-gray-400 text-xs">{block.block_type}</span>
                    <p className="text-white font-medium flex-1">{block.title || 'Untitled block'}</p>
                    <button type="button" onClick={() => moveBlock(block, -1)} className="icon-btn"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => moveBlock(block, 1)} className="icon-btn"><ArrowDown className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setBlockDraft(blockToDraft(block))} className="icon-btn"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => duplicateBlock(block)} className="icon-btn"><Copy className="w-4 h-4" /></button>
                    <button type="button" onClick={() => removeRecord('science_lesson_blocks', block.id, 'Block deleted.')} className="icon-btn text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="p-4">
                    <ScienceBlockRenderer block={block} questionsById={questionsById} />
                  </div>
                </div>
              ))}
            </div>

            <FormPanel title={blockDraft.id ? 'Edit Block' : 'Add Block'}>
              <div className="mb-5">
                <p className="mb-3 text-xs uppercase tracking-wide text-gray-600">Block Palette</p>
                <div className="grid grid-cols-2 gap-2">
                  {blockTypes.map((type) => {
                    const meta = blockTypeMeta[type];
                    const Icon = meta.icon;
                    const active = blockDraft.block_type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => chooseBlockType(type)}
                        className={`choice-tile min-h-[104px] ${active ? 'choice-tile-active' : ''}`}
                      >
                        <Icon className={`mb-2 h-4 w-4 ${active ? 'text-red-300' : 'text-gray-500'}`} />
                        <p className="text-sm font-medium text-white">{meta.label}</p>
                        <p className="mt-1 text-xs leading-snug text-gray-600">{meta.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5 border border-gray-800 bg-black/25 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{blockTypeMeta[blockDraft.block_type].label}</p>
                    <p className="text-xs text-gray-600">{blockDraft.block_type}</p>
                  </div>
                  <select value={blockDraft.block_type} onChange={(event) => chooseBlockType(event.target.value)} className="input max-w-[180px] text-sm">
                    {blockTypes.map((type) => <option key={type} value={type}>{blockTypeMeta[type].label}</option>)}
                  </select>
                </div>

                <Field label="Block Title"><input value={blockDraft.title} onChange={(event) => setBlockDraft({ ...blockDraft, title: event.target.value })} className="input" /></Field>

                {['rich_text', 'math', 'callout'].includes(blockDraft.block_type) && (
                  <Field label={blockDraft.block_type === 'math' ? 'Equation / Derivation Body' : 'Body'}>
                    <textarea value={blockDraft.body} onChange={(event) => setBlockDraft({ ...blockDraft, body: event.target.value })} rows={8} className="input font-mono text-sm" />
                  </Field>
                )}

                {blockDraft.block_type === 'callout' && (
                  <Field label="Note Type">
                    <select value={blockDraft.variant} onChange={(event) => setBlockDraft({ ...blockDraft, variant: event.target.value })} className="input">
                      <option value="intuition">Intuition</option>
                      <option value="definition">Definition</option>
                      <option value="theorem">Theorem</option>
                      <option value="warning">Warning</option>
                      <option value="mistake">Common mistake</option>
                    </select>
                  </Field>
                )}

                {blockDraft.block_type === 'worked_example' && (
                  <>
                    <Field label="Problem"><textarea value={blockDraft.problem} onChange={(event) => setBlockDraft({ ...blockDraft, problem: event.target.value })} rows={3} className="input" /></Field>
                    <Field label="Solution Steps"><textarea value={blockDraft.stepsText} onChange={(event) => setBlockDraft({ ...blockDraft, stepsText: event.target.value })} rows={6} className="input" /></Field>
                    <Field label="Final Answer"><input value={blockDraft.answer} onChange={(event) => setBlockDraft({ ...blockDraft, answer: event.target.value })} className="input" /></Field>
                  </>
                )}

                {blockDraft.block_type === 'simulation_embed' && (
                  <div className="mb-4 border border-gray-800 bg-black/25 p-3">
                    <p className="mb-3 text-xs uppercase tracking-wide text-gray-600">Simulation Lab Shells</p>
                    <div className="space-y-2">
                      {simulationLabTemplates.map((template) => (
                        <button
                          key={template.title}
                          type="button"
                          onClick={() => applySimulationTemplate(template)}
                          className="w-full border border-gray-800 bg-black/30 p-3 text-left hover:border-gray-600"
                        >
                          <p className="text-sm font-medium text-white">{template.title}</p>
                          <p className="mt-1 text-xs text-gray-600">{template.caption}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {['video', 'simulation_embed', 'image'].includes(blockDraft.block_type) && (
                  <>
                    <Field label={blockDraft.block_type === 'simulation_embed' ? 'Embeddable Lab URL' : 'URL'}><input value={blockDraft.url} onChange={(event) => setBlockDraft({ ...blockDraft, url: event.target.value })} className="input" /></Field>
                    <Field label="Caption"><input value={blockDraft.caption} onChange={(event) => setBlockDraft({ ...blockDraft, caption: event.target.value })} className="input" /></Field>
                  </>
                )}

                {blockDraft.block_type === 'simulation_embed' && (
                  <>
                    <Field label="Investigation Prompt"><textarea value={blockDraft.prompt} onChange={(event) => setBlockDraft({ ...blockDraft, prompt: event.target.value })} rows={3} className="input" /></Field>
                    <Field label="Setup Notes"><textarea value={blockDraft.setup} onChange={(event) => setBlockDraft({ ...blockDraft, setup: event.target.value })} rows={3} className="input" /></Field>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Variables / Controls" hint="Shown as the controlled quantities learners should watch while running the embed.">
                        <textarea value={blockDraft.variablesText} onChange={(event) => setBlockDraft({ ...blockDraft, variablesText: event.target.value })} rows={5} className="input" />
                      </Field>
                      <Field label="Learner Task Checklist" hint="Each line becomes a checkbox in the learner lab notebook.">
                        <textarea value={blockDraft.tasksText} onChange={(event) => setBlockDraft({ ...blockDraft, tasksText: event.target.value })} rows={5} className="input" />
                      </Field>
                    </div>
                    <Field label="Notebook Response Prompts" hint="Each line becomes a learner response box under the simulation. These are local activity notes in v1, not graded answers.">
                      <textarea value={blockDraft.observationsText} onChange={(event) => setBlockDraft({ ...blockDraft, observationsText: event.target.value })} rows={4} className="input" />
                    </Field>
                  </>
                )}

                {blockDraft.block_type === 'video' && (
                  <Field label="Transcript"><textarea value={blockDraft.transcript} onChange={(event) => setBlockDraft({ ...blockDraft, transcript: event.target.value })} rows={4} className="input" /></Field>
                )}

                {blockDraft.block_type === 'image' && (
                  <Field label="Alt Text"><input value={blockDraft.alt} onChange={(event) => setBlockDraft({ ...blockDraft, alt: event.target.value })} className="input" /></Field>
                )}

                {blockDraft.block_type === 'exercise' && (
                  <Field label="Question">
                    <select value={blockDraft.question_id} onChange={(event) => setBlockDraft({ ...blockDraft, question_id: event.target.value })} className="input">
                      <option value="">Select question</option>
                      {questions.map((question) => <option key={question.id} value={question.id}>{question.prompt}</option>)}
                    </select>
                  </Field>
                )}

                {blockDraft.block_type === 'quiz' && (
                  <Field label="Quiz">
                    <select value={blockDraft.quiz_id} onChange={(event) => setBlockDraft({ ...blockDraft, quiz_id: event.target.value })} className="input">
                      <option value="">Select quiz</option>
                      {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              <div className="mb-5 border border-gray-800 bg-black/25 p-4">
                <p className="mb-3 text-xs uppercase tracking-wide text-gray-600">Learner Preview</p>
                <ScienceBlockRenderer
                  block={{ block_type: blockDraft.block_type, title: blockDraft.title, content_json: createBlockContent(blockDraft) }}
                  questionsById={questionsById}
                />
              </div>

              <button type="button" onClick={saveBlock} disabled={isSaving || !selectedLesson} className="btn-primary w-full"><Save className="w-4 h-4" /> Save Block</button>
            </FormPanel>
          </section>
        )}

        {activeTab === 'questions' && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
            <FormPanel title="Reusable Question">
              <Field label="Type">
                <select value={questionDraft.question_type} onChange={(event) => setQuestionDraft({ ...questionDraft, question_type: event.target.value })} className="input">
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / false</option>
                  <option value="numeric">Numeric tolerance</option>
                  <option value="fill_blank">Fill blank</option>
                </select>
              </Field>
              <Field label="Prompt"><textarea value={questionDraft.prompt} onChange={(event) => setQuestionDraft({ ...questionDraft, prompt: event.target.value })} rows={4} className="input" /></Field>
              {questionDraft.question_type === 'multiple_choice' && (
                <Field label="Options (one per line)"><textarea value={questionDraft.optionsText} onChange={(event) => setQuestionDraft({ ...questionDraft, optionsText: event.target.value })} rows={4} className="input" /></Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Answer"><input value={questionDraft.correct_answer} onChange={(event) => setQuestionDraft({ ...questionDraft, correct_answer: event.target.value })} className="input" /></Field>
                <Field label="Tolerance"><input value={questionDraft.tolerance} onChange={(event) => setQuestionDraft({ ...questionDraft, tolerance: event.target.value })} className="input" /></Field>
              </div>
              <Field label="Explanation"><textarea value={questionDraft.explanation} onChange={(event) => setQuestionDraft({ ...questionDraft, explanation: event.target.value })} rows={3} className="input" /></Field>
              <Field label="Tags (one per line)"><textarea value={questionDraft.tagsText} onChange={(event) => setQuestionDraft({ ...questionDraft, tagsText: event.target.value })} rows={3} className="input" /></Field>
              <button type="button" onClick={saveQuestion} disabled={isSaving || !questionDraft.prompt || !questionDraft.correct_answer} className="btn-primary w-full"><Save className="w-4 h-4" /> Save Question</button>
            </FormPanel>
            <div className="border border-gray-800 bg-black/35">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-white font-semibold">Question Bank</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {questions.map((question) => (
                  <div key={question.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-white">{question.prompt}</p>
                        <p className="text-gray-600 text-sm mt-1">{question.question_type} · {question.difficulty} · Answer: {question.correct_answer}</p>
                      </div>
                      <button type="button" onClick={() => removeRecord('science_questions', question.id, 'Question deleted.')} className="icon-btn text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'quizzes' && (
          <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
            <FormPanel title="Create Checkpoint">
              <Field label="Title"><input value={quizDraft.title} onChange={(event) => setQuizDraft({ ...quizDraft, title: event.target.value })} className="input" /></Field>
              <Field label="Description"><textarea value={quizDraft.description} onChange={(event) => setQuizDraft({ ...quizDraft, description: event.target.value })} rows={3} className="input" /></Field>
              <Field label="Module">
                <select value={quizDraft.module_id || selectedModule?.id || ''} onChange={(event) => setQuizDraft({ ...quizDraft, module_id: event.target.value, lesson_id: '' })} className="input">
                  {outline.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
                </select>
              </Field>
              <Field label="Optional Lesson Scope">
                <select value={quizDraft.lesson_id || ''} onChange={(event) => setQuizDraft({ ...quizDraft, lesson_id: event.target.value })} className="input">
                  <option value="">Module checkpoint</option>
                  {outline.flatMap((module) => (module.science_lessons || []).map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{module.title} / {lesson.title}</option>
                  )))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pass %"><input type="number" value={quizDraft.passing_score} onChange={(event) => setQuizDraft({ ...quizDraft, passing_score: event.target.value })} className="input" /></Field>
                <Field label="Attempts"><input type="number" value={quizDraft.attempts_allowed} onChange={(event) => setQuizDraft({ ...quizDraft, attempts_allowed: event.target.value })} className="input" /></Field>
              </div>
              <button type="button" onClick={saveQuiz} disabled={isSaving || !quizDraft.title} className="btn-primary w-full"><Save className="w-4 h-4" /> Save Quiz</button>
            </FormPanel>

            <div className="space-y-5">
              <div className="border border-gray-800 bg-black/35 p-4">
                <h2 className="text-white font-semibold mb-4">Attach Question</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={attachQuizId} onChange={(event) => setAttachQuizId(event.target.value)} className="input">
                    <option value="">Select quiz</option>
                    {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
                  </select>
                  <select value={attachQuestionId} onChange={(event) => setAttachQuestionId(event.target.value)} className="input">
                    <option value="">Select question</option>
                    {questions.map((question) => <option key={question.id} value={question.id}>{question.prompt}</option>)}
                  </select>
                </div>
                <button type="button" onClick={attachQuestionToQuiz} disabled={isSaving || !attachQuizId || !attachQuestionId} className="btn-primary mt-3"><Plus className="w-4 h-4" /> Attach</button>
              </div>
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="border border-gray-800 bg-black/35 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-white font-medium">{quiz.title}</p>
                      <p className="text-gray-600 text-sm">{quiz.science_quiz_questions?.length || 0} questions · pass {quiz.passing_score}%</p>
                    </div>
                    <button type="button" onClick={() => removeRecord('science_quizzes', quiz.id, 'Quiz deleted.')} className="icon-btn text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(quiz.science_quiz_questions || []).map((link) => (
                      <p key={link.id} className="text-sm text-gray-400 border border-gray-800 bg-black/30 p-2">{link.science_questions?.prompt}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'importer' && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="border border-gray-800 bg-black/35 p-5">
              <h2 className="text-white font-semibold mb-4">Markdown Import</h2>
              <textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={28} className="input font-mono text-sm" />
              <button type="button" onClick={importCourse} disabled={isSaving || parsedImport.errors.length > 0 || !parsedImport.course.title} className="btn-primary mt-4">
                <FileInput className="w-4 h-4" />
                {isSaving ? 'Importing...' : 'Create Draft Course'}
              </button>
            </div>
            <div className="border border-gray-800 bg-black/35 p-5">
              <h2 className="text-white font-semibold mb-4">Import Preview</h2>
              {parsedImport.errors.length > 0 && (
                <div className="mb-4 border border-red-900/40 bg-red-950/20 p-3">
                  {parsedImport.errors.map((item) => <p key={`${item.line}-${item.message}`} className="text-red-200 text-sm">Line {item.line}: {item.message}</p>)}
                </div>
              )}
              <p className="text-2xl font-bold text-white">{parsedImport.course.title || 'No course title'}</p>
              <p className="text-gray-500 mt-1">{parsedImport.course.subjectName || 'No subject'} · {parsedImport.course.level}</p>
              <div className="mt-5 space-y-4">
                {parsedImport.modules.map((module) => (
                  <div key={module.slug} className="border border-gray-800 bg-black/30 p-4">
                    <p className="text-white font-semibold">{module.title}</p>
                    {(module.lessons || []).map((lesson) => (
                      <div key={lesson.slug} className="mt-3 border-l border-gray-800 pl-3">
                        <p className="text-gray-300">{lesson.title}</p>
                        <p className="text-gray-600 text-sm">{lesson.blocks.length} blocks</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'checklist' && (
          <section className="mt-6 border border-gray-800 bg-black/35 p-5">
            <h2 className="text-white font-semibold mb-4">Publishing Checklist</h2>
            <div className="grid gap-3">
              {checklist.map((item) => (
                <div key={item.label} className={`flex items-center gap-3 border p-3 ${item.ok ? 'border-green-900/40 bg-green-950/10' : 'border-yellow-900/40 bg-yellow-950/10'}`}>
                  {item.ok ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                  <p className={item.ok ? 'text-green-100' : 'text-yellow-100'}>{item.label}</p>
                </div>
              ))}
            </div>
            {checklist.every((item) => item.ok) ? (
              <p className="mt-5 text-green-300">This course is ready to publish.</p>
            ) : (
              <p className="mt-5 text-gray-500">Fix the yellow items before switching the course status to published.</p>
            )}
          </section>
        )}
          </section>

          <aside className="space-y-4">
            <div className="border border-gray-800 bg-black/30 p-4">
              <h2 className="text-white font-semibold mb-3">Inspector</h2>
              <InspectorRow label="Course" value={selectedCourse?.title || 'New course'} />
              <InspectorRow label="Status" value={selectedCourse?.status || 'draft'} />
              <InspectorRow label="Module" value={selectedModule?.title || 'None'} />
              <InspectorRow label="Lesson" value={selectedLesson?.title || 'None'} />
              <InspectorRow label="Questions" value={studioStats.questions} />
              <InspectorRow label="Quizzes" value={studioStats.quizzes} />
            </div>

            <div className="border border-gray-800 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-white font-semibold">Publishing Readiness</h2>
                <span className="text-red-400 font-semibold">{studioStats.readiness}%</span>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-start gap-2 text-sm">
                    {item.ok ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                    <span className={item.ok ? 'text-gray-400' : 'text-yellow-100'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, hint, children }) => (
  <label className="block mb-4">
    <span className="block text-sm text-gray-500 mb-2">{label}</span>
    {hint && <span className="block -mt-1 mb-2 text-xs leading-relaxed text-gray-700">{hint}</span>}
    {children}
  </label>
);

const FormPanel = ({ title, children }) => (
  <div className="border border-gray-800 bg-black/35 p-5 h-fit">
    <div className="flex items-center gap-2 mb-4">
      <Pencil className="w-4 h-4 text-red-500" />
      <h2 className="text-white font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const StudioMetric = ({ label, value, icon: Icon }) => (
  <div className="border border-gray-800 bg-black/30 p-3">
    <div className="flex items-center gap-2 text-gray-500">
      <Icon className="w-4 h-4 text-red-400" />
      <span className="text-xs uppercase tracking-wide">{label}</span>
    </div>
    <p className="mt-1 text-xl font-bold text-white">{value}</p>
  </div>
);

const InspectorRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-gray-800 py-2 last:border-b-0">
    <span className="text-xs uppercase tracking-wide text-gray-600">{label}</span>
    <span className="text-sm text-gray-300 text-right">{value}</span>
  </div>
);

const ReadinessLine = ({ ok, label }) => (
  <div className="flex items-center gap-2">
    {ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-700" />}
    <span className={ok ? 'text-gray-300' : 'text-gray-600'}>{label}</span>
  </div>
);

export default ScienceAdminPage;
