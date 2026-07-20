import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import Header from '../../components/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Plus, Edit, Trash2, X, ChevronDown, ChevronRight, 
  BookOpen, Video, FileText, HelpCircle, Eye, EyeOff,
  Sparkles, ListChecks, Target, Layers, CheckCircle2, AlertTriangle
} from 'lucide-react';

const slugify = (value) => {
  const slug = `${value || ''}`
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
};

const SUPABASE_WRITE_TIMEOUT_MS = 15000;

const withSupabaseTimeout = async (request, timeoutMessage) => {
  let timeoutId;

  try {
    return await Promise.race([
      request,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), SUPABASE_WRITE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const getSupabaseErrorMessage = (error, fallback) => {
  const message = error?.message || `${error || ''}` || fallback;
  const lowerMessage = message.toLowerCase();
  const code = error?.code ? `${error.code}` : '';

  if (code === '23505' || lowerMessage.includes('duplicate key')) {
    return 'A course with this slug already exists. Change the Slug (URL) or use a more specific title.';
  }

  if (
    code === '42501' ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('violates row-level security policy') ||
    lowerMessage.includes('jwt') ||
    lowerMessage.includes('no authenticated supabase admin session')
  ) {
    return 'Supabase rejected the save. You need to be logged in as a real authenticated admin; local admin preview cannot write courses.';
  }

  if (lowerMessage.includes('timed out') || lowerMessage.includes('timeout')) {
    return 'Supabase did not respond while saving. Check the connection, then try again.';
  }

  return message || fallback;
};

const AUTHORING_PATTERNS = [
  {
    title: 'Modular outline',
    icon: Layers,
    text: 'Build a course as chapters, then lessons, then components: reading, video, practice, and tests.',
  },
  {
    title: 'Practice loop',
    icon: Target,
    text: 'Keep lessons short and make every concept earn its place with an exercise immediately after it.',
  },
  {
    title: 'Guided discovery',
    icon: Sparkles,
    text: 'Use questions, worked examples, and feedback to make learners actively notice the core idea.',
  },
];

const createExercise = (question, options, correctAnswer, explanation, hint = '') => ({
  exercise_type: 'multiple_choice',
  question,
  options,
  correct_answer: correctAnswer,
  explanation,
  hint,
});

const buildBlueprintLessonContent = (title, focus) => `## ${title}

### Learning objective
By the end of this lesson, learners should be able to explain ${focus} and use it in a concrete example.

### Core idea
Write the shortest possible explanation of the concept here. Start with the intuition, then add the formal definition or rule.

### Worked example
Show one complete example step by step. Name each move so learners can recognize the pattern later.

### Try it
Add one short prompt that asks learners to apply the idea before they move on.

### Reflection
What should learners now be able to see that they could not see before?`;

const COURSE_BLUEPRINTS = [
  {
    id: 'practice-first',
    title: 'Practice-first course',
    badge: 'Practice template',
    description: 'Four chapters with short concept lessons, practice lessons, and checkpoint tests.',
    chapters: [
      {
        title: 'Orientation and First Tools',
        description: 'Set the problem, define the basic vocabulary, and get learners using the first tool immediately.',
        lessons: [
          {
            title: 'What This Course Is For',
            lesson_type: 'video',
            summary: 'A short opening lesson that names the course promise and the first usable skill.',
            content: buildBlueprintLessonContent('What This Course Is For', 'the main purpose of the course'),
            xp_reward: 10,
          },
          {
            title: 'The First Concept',
            lesson_type: 'reading',
            summary: 'Introduce the first core concept with one example learners can imitate.',
            content: buildBlueprintLessonContent('The First Concept', 'the first core concept'),
            xp_reward: 15,
          },
          {
            title: 'First Practice Set',
            lesson_type: 'exercise',
            summary: 'Give learners a low-friction chance to apply the first concept.',
            content: buildBlueprintLessonContent('First Practice Set', 'the first concept in practice'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'Which statement best captures the main use of this concept?',
                ['It names the key relation', 'It replaces evidence', 'It removes the need for practice', 'It only works in one example'],
                'It names the key relation',
                'The first concept should help learners identify the relation they will practice throughout the course.',
                'Look for the option that describes a reusable tool.'
              ),
              createExercise(
                'What should come immediately after a short explanation?',
                ['A chance to apply it', 'A completely unrelated topic', 'A long list of references', 'A final certificate'],
                'A chance to apply it',
                'Practice closes the loop between explanation and understanding.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Core Mechanism',
        description: 'Explain how the main mechanism works and make learners manipulate it.',
        lessons: [
          {
            title: 'How the Mechanism Works',
            lesson_type: 'reading',
            summary: 'Break the core process into named steps.',
            content: buildBlueprintLessonContent('How the Mechanism Works', 'the course mechanism'),
            xp_reward: 15,
          },
          {
            title: 'Follow the Chain',
            lesson_type: 'exercise',
            summary: 'Practice tracing the mechanism through a concrete case.',
            content: buildBlueprintLessonContent('Follow the Chain', 'the mechanism across a case'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'When tracing a mechanism, what should learners identify first?',
                ['The starting condition', 'The final certificate', 'The longest paragraph', 'The page color'],
                'The starting condition',
                'A mechanism needs a starting condition before its steps can be followed.',
              ),
            ],
          },
          {
            title: 'Common Mistakes',
            lesson_type: 'quiz',
            summary: 'Use misconceptions as prompts for better reasoning.',
            content: buildBlueprintLessonContent('Common Mistakes', 'the most common misconceptions'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'Why are wrong answers useful in this lesson?',
                ['They reveal the misconception', 'They should be ignored', 'They make content shorter', 'They replace explanations'],
                'They reveal the misconception',
                'A good distractor points to a specific misunderstanding that feedback can correct.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Application Workshop',
        description: 'Move from guided examples to more independent application.',
        lessons: [
          {
            title: 'Worked Application',
            lesson_type: 'reading',
            summary: 'Walk through a full application before asking learners to do their own.',
            content: buildBlueprintLessonContent('Worked Application', 'the concept in a realistic scenario'),
            xp_reward: 15,
          },
          {
            title: 'Build Your Own Example',
            lesson_type: 'exercise',
            summary: 'Prompt learners to choose, justify, and check an example.',
            content: buildBlueprintLessonContent('Build Your Own Example', 'creating an independent example'),
            xp_reward: 25,
            exercises: [
              createExercise(
                'A strong learner-built example should include what?',
                ['A claim, evidence, and a check', 'Only a title', 'Only a definition', 'Only a conclusion'],
                'A claim, evidence, and a check',
                'Application gets stronger when learners can support and verify the answer.',
              ),
            ],
          },
          {
            title: 'Practice Review',
            lesson_type: 'quiz',
            summary: 'Review the chapter with short active-recall prompts.',
            content: buildBlueprintLessonContent('Practice Review', 'retrieving and checking the main ideas'),
            xp_reward: 20,
          },
        ],
      },
      {
        title: 'Synthesis and Next Steps',
        description: 'Connect the course ideas and prepare learners for transfer.',
        lessons: [
          {
            title: 'Put the Pieces Together',
            lesson_type: 'reading',
            summary: 'Show how the course concepts connect into one working framework.',
            content: buildBlueprintLessonContent('Put the Pieces Together', 'the full course framework'),
            xp_reward: 20,
          },
          {
            title: 'Transfer Challenge',
            lesson_type: 'exercise',
            summary: 'Ask learners to apply the framework in a new case.',
            content: buildBlueprintLessonContent('Transfer Challenge', 'using the framework in a new context'),
            xp_reward: 30,
            exercises: [
              createExercise(
                'What makes a transfer challenge different from a repeated example?',
                ['It changes the context while preserving the core pattern', 'It removes the concept entirely', 'It is always easier', 'It has no feedback'],
                'It changes the context while preserving the core pattern',
                'Transfer checks whether learners can recognize the same structure in a new situation.',
              ),
            ],
          },
          {
            title: 'Course Review',
            lesson_type: 'quiz',
            summary: 'End with retrieval, synthesis, and a clear path forward.',
            content: buildBlueprintLessonContent('Course Review', 'the course as a whole'),
            xp_reward: 25,
          },
        ],
      },
    ],
  },
  {
    id: 'guided-discovery',
    title: 'Guided discovery course',
    badge: 'Discovery template',
    description: 'Concepts unfold through questions, intuition checks, and immediate feedback.',
    chapters: [
      {
        title: 'Notice the Pattern',
        description: 'Start with observation before naming the formal idea.',
        lessons: [
          {
            title: 'A Puzzle First',
            lesson_type: 'exercise',
            summary: 'Open with a puzzle that reveals why the concept matters.',
            content: buildBlueprintLessonContent('A Puzzle First', 'the pattern learners should notice'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'What is the point of starting with a puzzle?',
                ['It gives learners something to notice', 'It hides the objective', 'It removes feedback', 'It replaces the lesson'],
                'It gives learners something to notice',
                'A good opening puzzle creates the need for the concept.',
              ),
            ],
          },
          {
            title: 'Name the Pattern',
            lesson_type: 'reading',
            summary: 'Turn the learner observation into a named concept.',
            content: buildBlueprintLessonContent('Name the Pattern', 'the newly named pattern'),
            xp_reward: 15,
          },
          {
            title: 'Check the Intuition',
            lesson_type: 'quiz',
            summary: 'Use short questions to catch misconceptions early.',
            content: buildBlueprintLessonContent('Check the Intuition', 'the intuition behind the pattern'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'A good intuition check should be...',
                ['Small and diagnostic', 'Long and unfocused', 'Unrelated to the concept', 'Impossible to answer'],
                'Small and diagnostic',
                'The point is to reveal whether the central idea has clicked.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Build the Rule',
        description: 'Move from examples to a general rule learners can test.',
        lessons: [
          {
            title: 'From Example to Rule',
            lesson_type: 'reading',
            summary: 'Show how repeated examples become a general rule.',
            content: buildBlueprintLessonContent('From Example to Rule', 'generalizing from examples'),
            xp_reward: 15,
          },
          {
            title: 'Stress-Test the Rule',
            lesson_type: 'exercise',
            summary: 'Ask learners to find where the rule works and where it breaks.',
            content: buildBlueprintLessonContent('Stress-Test the Rule', 'testing the rule against edge cases'),
            xp_reward: 25,
            exercises: [
              createExercise(
                'Why test a rule against edge cases?',
                ['To learn its limits', 'To avoid examples', 'To make it vague', 'To skip practice'],
                'To learn its limits',
                'Edge cases make the boundaries of a concept visible.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Use It Fluently',
        description: 'Make learners choose the right move without being told.',
        lessons: [
          {
            title: 'Choose the Move',
            lesson_type: 'exercise',
            summary: 'Learners decide which method fits each situation.',
            content: buildBlueprintLessonContent('Choose the Move', 'selecting the right method'),
            xp_reward: 25,
            exercises: [
              createExercise(
                'What shows real fluency?',
                ['Choosing the method that fits the situation', 'Memorizing one phrase', 'Avoiding feedback', 'Skipping the problem'],
                'Choosing the method that fits the situation',
                'Fluency means learners can match a tool to a situation.',
              ),
            ],
          },
          {
            title: 'Explain Your Reasoning',
            lesson_type: 'quiz',
            summary: 'Prompt learners to justify the answer, not just select it.',
            content: buildBlueprintLessonContent('Explain Your Reasoning', 'justifying a solution'),
            xp_reward: 25,
          },
        ],
      },
    ],
  },
  {
    id: 'modular-studio',
    title: 'Modular studio course',
    badge: 'Module template',
    description: 'A clean course shell with modules, units, components, visibility checks, and tests.',
    chapters: [
      {
        title: 'Module 1: Foundations',
        description: 'A first module with orientation, a concept unit, and a practice component.',
        lessons: [
          {
            title: 'Unit 1: Orientation',
            lesson_type: 'reading',
            summary: 'Set context, prerequisites, and success criteria.',
            content: buildBlueprintLessonContent('Unit 1: Orientation', 'the course prerequisites and goals'),
            xp_reward: 10,
          },
          {
            title: 'Unit 2: Text Component',
            lesson_type: 'reading',
            summary: 'Main instructional text with formulas, examples, and definitions.',
            content: buildBlueprintLessonContent('Unit 2: Text Component', 'the first formal concept'),
            xp_reward: 15,
          },
          {
            title: 'Unit 3: Problem Component',
            lesson_type: 'exercise',
            summary: 'Practice component attached to the unit.',
            content: buildBlueprintLessonContent('Unit 3: Problem Component', 'checking the first formal concept'),
            xp_reward: 20,
            exercises: [
              createExercise(
                'What should a problem component test?',
                ['The current unit objective', 'A random future topic', 'Only page navigation', 'Nothing specific'],
                'The current unit objective',
                'The exercise should be aligned with the unit objective.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Module 2: Methods',
        description: 'A module focused on procedure, examples, and practice.',
        lessons: [
          {
            title: 'Unit 1: Method Walkthrough',
            lesson_type: 'video',
            summary: 'A short walkthrough of the core method.',
            content: buildBlueprintLessonContent('Unit 1: Method Walkthrough', 'the chapter method'),
            xp_reward: 15,
          },
          {
            title: 'Unit 2: Guided Practice',
            lesson_type: 'exercise',
            summary: 'Step-by-step practice with feedback.',
            content: buildBlueprintLessonContent('Unit 2: Guided Practice', 'using the method with feedback'),
            xp_reward: 25,
            exercises: [
              createExercise(
                'What belongs in guided practice?',
                ['A prompt and feedback', 'Only a heading', 'Only an unrelated reading', 'Only a final grade'],
                'A prompt and feedback',
                'Guided practice needs a learner action and a response that teaches.',
              ),
            ],
          },
        ],
      },
      {
        title: 'Module 3: Assessment',
        description: 'A module that checks readiness before publishing.',
        lessons: [
          {
            title: 'Unit 1: Review',
            lesson_type: 'reading',
            summary: 'Review the key claims, definitions, and methods.',
            content: buildBlueprintLessonContent('Unit 1: Review', 'the course key ideas'),
            xp_reward: 15,
          },
          {
            title: 'Unit 2: Checkpoint',
            lesson_type: 'quiz',
            summary: 'A short quiz-style lesson before the chapter test.',
            content: buildBlueprintLessonContent('Unit 2: Checkpoint', 'readiness for the chapter test'),
            xp_reward: 20,
          },
        ],
      },
    ],
  },
];

const LESSON_TEMPLATES = [
  {
    id: 'concept',
    label: 'Concept',
    icon: FileText,
    lesson_type: 'reading',
    summary: (title) => `Define ${title || 'the concept'} with intuition, formal language, and a worked example.`,
    xp_reward: 15,
    buildContent: (title) => `## ${title || 'Concept Lesson'}

### Why this matters
Open with the real problem this concept helps learners solve.

### Intuition
Explain the idea in ordinary language before introducing notation or terminology.

### Definition
State the concept precisely.

### Worked example
Walk through one example step by step.

### Check yourself
Ask one short question learners should be able to answer before continuing.`,
  },
  {
    id: 'video',
    label: 'Video',
    icon: Video,
    lesson_type: 'video',
    summary: (title) => `Short video script and follow-up notes for ${title || 'this lesson'}.`,
    xp_reward: 10,
    buildContent: (title) => `## ${title || 'Video Lesson'}

### Video objective
In 3-5 minutes, learners should understand the main idea and be ready for practice.

### Script outline
1. Hook: name the problem.
2. Explain: introduce the concept.
3. Show: work one example.
4. Prompt: ask learners to try the next step.

### After the video
Summarize the idea in three bullets and link it to the next exercise.`,
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: Target,
    lesson_type: 'exercise',
    summary: (title) => `Practice applying ${title || 'the concept'} with feedback.`,
    xp_reward: 20,
    buildContent: (title) => `## ${title || 'Practice Lesson'}

### Practice goal
Learners should apply the idea without copying the worked example.

### Setup
Give the scenario, data, or prompt.

### Tasks
1. Identify the relevant concept.
2. Apply it to the case.
3. Check the result against the explanation.

### Feedback note
Use the exercise manager to add multiple-choice, numeric, or fill-in-the-blank checks.`,
  },
  {
    id: 'checkpoint',
    label: 'Checkpoint',
    icon: HelpCircle,
    lesson_type: 'quiz',
    summary: (title) => `Checkpoint questions for ${title || 'this chapter'}.`,
    xp_reward: 20,
    buildContent: (title) => `## ${title || 'Checkpoint'}

### What to retrieve
List the 3-5 ideas learners should remember without rereading.

### Mini challenge
Pose one new situation that requires choosing the right method.

### Explain the answer
After learners answer, show why the right answer works and why tempting wrong answers fail.

### Ready to continue?
Point learners to the chapter test or the next module.`,
  },
];

const STEMAdminPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showExerciseList, setShowExerciseList] = useState(null);
  const [exerciseListData, setExerciseListData] = useState([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isApplyingBlueprint, setIsApplyingBlueprint] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: subjectsData } = await supabase
        .from('stem_subjects')
        .select('*')
        .order('order_index');
      setSubjects(subjectsData || []);

      const { data: coursesData } = await supabase
        .from('stem_courses')
        .select('*, stem_subjects(name, color)')
        .order('order_index');
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    try {
      const { data } = await supabase
        .from('stem_chapters')
        .select(`
          *,
          stem_lessons(id, title, slug, lesson_type, order_index, stem_exercises(id)),
          stem_chapter_tests(id, title)
        `)
        .eq('course_id', courseId)
        .order('order_index');
      
      const sortedChapters = (data || []).map(ch => ({
        ...ch,
        stem_lessons: (ch.stem_lessons || []).sort((a, b) => a.order_index - b.order_index)
      }));
      setChapters(sortedChapters);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const togglePublish = async (course) => {
    try {
      await supabase
        .from('stem_courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course and all its content?')) return;
    try {
      await supabase.from('stem_courses').delete().eq('id', courseId);
      fetchData();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setChapters([]);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const deleteChapter = async (chapterId) => {
    if (!window.confirm('Delete this chapter and all its lessons?')) return;
    try {
      await supabase.from('stem_chapters').delete().eq('id', chapterId);
      fetchChapters(selectedCourse.id);
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await supabase.from('stem_lessons').delete().eq('id', lessonId);
      fetchChapters(selectedCourse.id);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  const fetchExercises = async (lessonId) => {
    try {
      const { data } = await supabase
        .from('stem_exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      setExerciseListData(data || []);
      setShowExerciseList(lessonId);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const deleteExercise = async (exerciseId) => {
    if (!window.confirm('Delete this exercise?')) return;
    try {
      await supabase.from('stem_exercises').delete().eq('id', exerciseId);
      if (showExerciseList) fetchExercises(showExerciseList);
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const fetchFullLesson = async (lessonId, chapterId) => {
    try {
      const { data } = await supabase
        .from('stem_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
      if (data) {
        setEditingItem({ ...data, chapter_id: chapterId });
        setShowLessonModal(true);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    }
  };

  const applyCourseBlueprint = async (blueprint) => {
    if (!selectedCourse || !blueprint) return;

    if (
      chapters.length > 0 &&
      !window.confirm('This course already has content. Add this blueprint after the existing chapters?')
    ) {
      return;
    }

    setIsApplyingBlueprint(true);
    try {
      const { data: sessionData, error: sessionError } = await withSupabaseTimeout(
        supabase.auth.getSession(),
        'Admin session check timed out.'
      );
      if (sessionError) throw sessionError;
      if (!sessionData?.session) {
        throw new Error('No authenticated Supabase admin session.');
      }

      const currentMaxOrder = chapters.reduce(
        (max, chapter) => Math.max(max, Number(chapter.order_index) || 0),
        chapters.length ? 0 : -1
      );
      const runId = Date.now().toString(36);
      const shouldSuffixSlugs = chapters.length > 0;

      for (const [chapterIndex, blueprintChapter] of blueprint.chapters.entries()) {
        const chapterSlug = shouldSuffixSlugs
          ? `${slugify(blueprintChapter.title)}-${runId}-${chapterIndex + 1}`
          : slugify(blueprintChapter.title);

        const { data: insertedChapter, error: chapterError } = await withSupabaseTimeout(
          supabase
            .from('stem_chapters')
            .insert({
              course_id: selectedCourse.id,
              title: blueprintChapter.title,
              slug: chapterSlug,
              description: blueprintChapter.description,
              order_index: currentMaxOrder + chapterIndex + 1,
            })
            .select()
            .single(),
          'Chapter blueprint save timed out.'
        );

        if (chapterError) throw chapterError;

        const lessonRows = blueprintChapter.lessons.map((lesson, lessonIndex) => ({
          chapter_id: insertedChapter.id,
          title: lesson.title,
          slug: slugify(lesson.title),
          lesson_type: lesson.lesson_type,
          summary: lesson.summary,
          content: lesson.content,
          xp_reward: lesson.xp_reward || 10,
          order_index: lessonIndex,
        }));

        const { data: insertedLessons, error: lessonError } = await withSupabaseTimeout(
          supabase
            .from('stem_lessons')
            .insert(lessonRows)
            .select(),
          'Lesson blueprint save timed out.'
        );

        if (lessonError) throw lessonError;

        const exerciseRows = (insertedLessons || []).flatMap((savedLesson, lessonIndex) => {
          const blueprintLesson = blueprintChapter.lessons[lessonIndex];
          return (blueprintLesson.exercises || []).map((exercise, exerciseIndex) => ({
            lesson_id: savedLesson.id,
            exercise_type: exercise.exercise_type,
            question: exercise.question,
            options: exercise.options,
            correct_answer: exercise.correct_answer,
            hint: exercise.hint || null,
            explanation: exercise.explanation || null,
            order_index: exerciseIndex,
          }));
        });

        if (exerciseRows.length > 0) {
          const { error: exerciseError } = await withSupabaseTimeout(
            supabase
              .from('stem_exercises')
              .insert(exerciseRows),
            'Exercise blueprint save timed out.'
          );

          if (exerciseError) throw exerciseError;
        }

        const { data: insertedTest, error: testError } = await withSupabaseTimeout(
          supabase
            .from('stem_chapter_tests')
            .insert({
              chapter_id: insertedChapter.id,
              title: `${blueprintChapter.title} Checkpoint`,
              passing_score: 70,
              time_limit_minutes: 20,
            })
            .select()
            .single(),
          'Chapter test blueprint save timed out.'
        );

        if (testError) throw testError;

        const { error: questionError } = await withSupabaseTimeout(
          supabase
            .from('stem_test_questions')
            .insert({
              test_id: insertedTest.id,
              question: 'Which lesson objective best represents this chapter?',
              question_type: 'multiple_choice',
              options: [
                'Replace this placeholder with the real chapter objective',
                'Skip all practice',
                'Hide the key concept',
                'Assess an unrelated topic',
              ],
              correct_answer: 'Replace this placeholder with the real chapter objective',
              explanation: 'Edit this question after you finish the chapter content.',
              points: 1,
              order_index: 0,
            }),
          'Chapter test question blueprint save timed out.'
        );

        if (questionError) throw questionError;

        if (chapterIndex === 0) {
          setExpandedChapter(insertedChapter.id);
        }
      }

      await fetchChapters(selectedCourse.id);
    } catch (error) {
      console.error('Error applying course blueprint:', error);
      alert(getSupabaseErrorMessage(error, 'Could not apply this blueprint.'));
    } finally {
      setIsApplyingBlueprint(false);
    }
  };

  const lessonTypeIcons = {
    video: Video,
    reading: FileText,
    exercise: HelpCircle,
    quiz: HelpCircle,
  };

  return (
    <div className="min-h-screen bg-[#12131A]">
      <Header />
      <div className="pt-20 px-4 pb-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">STEM Course Management</h1>
              <p className="text-gray-400 mt-1">Create and manage courses, chapters, and lessons</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {['courses', 'textbooks', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-red-600 text-white'
                    : 'bg-black/30 text-gray-400 hover:bg-black/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course List */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Courses</h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setShowCourseModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-gray-400 text-center py-8">Loading...</div>
                ) : courses.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No courses yet</div>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedCourse?.id === course.id
                            ? 'bg-red-900/20 border-red-500/50'
                            : 'bg-black/40 border-red-900/30 hover:border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium text-sm">{course.title}</h3>
                              {course.is_published ? (
                                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                  Live
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs mt-1">
                              {course.stem_subjects?.name} • {course.difficulty}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePublish(course);
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                              title={course.is_published ? 'Unpublish' : 'Publish'}
                            >
                              {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(course);
                                setShowCourseModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCourse(course.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chapter & Lesson Editor */}
              <div className="lg:col-span-2">
                {selectedCourse ? (
                  <div className="bg-black/40 rounded-xl border border-red-900/30 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedCourse.title}</h2>
                        <p className="text-gray-500 text-sm">Manage chapters and lessons</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setShowChapterModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Chapter
                      </button>
                    </div>

                    <CourseAuthoringPanel
                      course={selectedCourse}
                      chapters={chapters}
                      onApplyBlueprint={applyCourseBlueprint}
                      isApplyingBlueprint={isApplyingBlueprint}
                    />

                    {chapters.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-300 font-medium">Course shell saved. Now add the actual content.</p>
                        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                          Course material lives inside lessons. Create a chapter first, then add lessons with Markdown content, video links, exercises, and tests.
                        </p>
                        <button
                          onClick={() => {
                            setEditingItem(null);
                            setShowChapterModal(true);
                          }}
                          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Chapter
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chapters.map((chapter, chIdx) => (
                          <div
                            key={chapter.id}
                            className="bg-black/30 rounded-lg border border-gray-800 overflow-hidden"
                          >
                            {/* Chapter Header */}
                            <div className="flex items-center gap-3 p-4">
                              <button
                                onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {expandedChapter === chapter.id ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <span className="text-white font-medium">
                                  {chIdx + 1}. {chapter.title}
                                </span>
                                <span className="text-gray-500 text-sm ml-2">
                                  ({chapter.stem_lessons?.length || 0} lessons)
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingItem(chapter);
                                    setShowTestModal(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-purple-400"
                                  title="Manage chapter test"
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(chapter);
                                    setShowChapterModal(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-white"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteChapter(chapter.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Lessons */}
                            {expandedChapter === chapter.id && (
                              <div className="border-t border-gray-800 p-4 pt-2">
                                <div className="space-y-2">
                                  {chapter.stem_lessons?.map((lesson, lIdx) => {
                                    const Icon = lessonTypeIcons[lesson.lesson_type] || FileText;
                                    return (
                                      <div
                                        key={lesson.id}
                                        className="flex items-center gap-3 p-2 bg-black/20 rounded-lg"
                                      >
                                        <Icon className="w-4 h-4 text-gray-500" />
                                        <span className="text-gray-300 text-sm flex-1">
                                          {lIdx + 1}. {lesson.title}
                                        </span>
                                        <span className="text-gray-600 text-xs capitalize">
                                          {lesson.lesson_type}
                                        </span>
                                        <button
                                          onClick={() => fetchExercises(lesson.id)}
                                          className="p-1 text-gray-400 hover:text-yellow-400"
                                          title="Manage exercises"
                                        >
                                          <HelpCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => fetchFullLesson(lesson.id, chapter.id)}
                                          className="p-1 text-gray-400 hover:text-white"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteLesson(lesson.id)}
                                          className="p-1 text-gray-400 hover:text-red-400"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Exercise list inline */}
                                {showExerciseList && chapter.stem_lessons?.some(l => l.id === showExerciseList) && (
                                  <div className="mt-3 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-yellow-400 text-sm font-medium">Exercises for: {chapter.stem_lessons.find(l => l.id === showExerciseList)?.title}</h4>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingItem({ lesson_id: showExerciseList });
                                            setShowExerciseModal(true);
                                          }}
                                          className="text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Add Exercise
                                        </button>
                                        <button onClick={() => setShowExerciseList(null)} className="text-gray-500 hover:text-white">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    {exerciseListData.length === 0 ? (
                                      <p className="text-gray-500 text-xs">No exercises yet</p>
                                    ) : (
                                      <div className="space-y-1">
                                        {exerciseListData.map((ex, eIdx) => (
                                          <div key={ex.id} className="flex items-center gap-2 p-2 bg-black/20 rounded text-xs">
                                            <span className="text-gray-500 w-4">{eIdx + 1}.</span>
                                            <span className="text-gray-300 flex-1 truncate">{ex.question}</span>
                                            <span className="text-gray-600 capitalize">{ex.exercise_type.replace('_', ' ')}</span>
                                            <button
                                              onClick={() => {
                                                setEditingItem({ ...ex, lesson_id: showExerciseList });
                                                setShowExerciseModal(true);
                                              }}
                                              className="p-0.5 text-gray-400 hover:text-white"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => deleteExercise(ex.id)}
                                              className="p-0.5 text-gray-400 hover:text-red-400"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={() => {
                                    setEditingItem({ chapter_id: chapter.id });
                                    setShowLessonModal(true);
                                  }}
                                  className="mt-3 flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Lesson
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/40 rounded-xl border border-red-900/30 p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Select a course to manage its content</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'textbooks' && (
            <TextbookManager />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}
        </div>
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <CourseModal
          course={editingItem}
          subjects={subjects}
          onClose={() => {
            setShowCourseModal(false);
            setEditingItem(null);
          }}
          onSave={(savedCourse) => {
            setShowCourseModal(false);
            setEditingItem(null);
            fetchData();
            if (savedCourse) {
              setSelectedCourse(savedCourse);
              setExpandedChapter(null);
            }
          }}
        />
      )}

      {/* Chapter Modal */}
      {showChapterModal && selectedCourse && (
        <ChapterModal
          chapter={editingItem}
          courseId={selectedCourse.id}
          onClose={() => {
            setShowChapterModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowChapterModal(false);
            setEditingItem(null);
            fetchChapters(selectedCourse.id);
          }}
        />
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <LessonModal
          lesson={editingItem}
          onClose={() => {
            setShowLessonModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowLessonModal(false);
            setEditingItem(null);
            fetchChapters(selectedCourse.id);
          }}
        />
      )}

      {/* Exercise Modal */}
      {showExerciseModal && (
        <ExerciseModal
          exercise={editingItem}
          onClose={() => {
            setShowExerciseModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowExerciseModal(false);
            setEditingItem(null);
            if (showExerciseList) fetchExercises(showExerciseList);
          }}
        />
      )}

      {/* Test Modal */}
      {showTestModal && selectedCourse && (
        <ChapterTestModal
          chapter={editingItem}
          onClose={() => {
            setShowTestModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowTestModal(false);
            setEditingItem(null);
            fetchChapters(selectedCourse.id);
          }}
        />
      )}
    </div>
  );
};

const CourseAuthoringPanel = ({ course, chapters, onApplyBlueprint, isApplyingBlueprint }) => {
  const lessons = chapters.flatMap((chapter) => chapter.stem_lessons || []);
  const exerciseCount = lessons.reduce(
    (total, lesson) => total + (lesson.stem_exercises?.length || 0),
    0
  );
  const testCount = chapters.reduce(
    (total, chapter) => total + (chapter.stem_chapter_tests?.length || 0),
    0
  );
  const learningOutcomeCount = Array.isArray(course.what_youll_learn)
    ? course.what_youll_learn.filter(Boolean).length
    : 0;

  const checklist = [
    {
      label: 'Course overview',
      done: Boolean(course.description?.trim()) && learningOutcomeCount >= 3,
      detail: `${learningOutcomeCount}/3 outcomes`,
    },
    {
      label: 'Chapter structure',
      done: chapters.length >= 1 && chapters.every((chapter) => (chapter.stem_lessons || []).length >= 1),
      detail: `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Lesson content',
      done: lessons.length >= 3,
      detail: `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''}`,
    },
    {
      label: 'Active practice',
      done: exerciseCount >= Math.max(1, Math.floor(lessons.length / 2)),
      detail: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`,
    },
    {
      label: 'Chapter checks',
      done: chapters.length > 0 && testCount >= chapters.length,
      detail: `${testCount}/${chapters.length || 1} tests`,
    },
    {
      label: 'Publishing state',
      done: course.is_published,
      detail: course.is_published ? 'Live' : 'Draft',
    },
  ];

  const readyCount = checklist.filter((item) => item.done).length;

  return (
    <div className="mb-6 border-y border-gray-800 py-5 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
            <ListChecks className="w-4 h-4 text-red-400" />
            Course builder
          </div>
          <p className="text-gray-500 text-sm mt-1 max-w-2xl">
            Use a blueprint for the full course shell, then edit each lesson's Markdown content and attach exercises from the lesson row.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 min-w-[280px]">
          {[
            { label: 'Chapters', value: chapters.length },
            { label: 'Lessons', value: lessons.length },
            { label: 'Exercises', value: exerciseCount },
            { label: 'Tests', value: testCount },
          ].map((stat) => (
            <div key={stat.label} className="border border-gray-800 bg-black/20 px-3 py-2 text-center">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {AUTHORING_PATTERNS.map((pattern) => {
          const Icon = pattern.icon;
          return (
            <div key={pattern.title} className="border border-gray-800 bg-black/20 p-3">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Icon className="w-4 h-4 text-red-400" />
                {pattern.title}
              </div>
              <p className="text-gray-500 text-xs leading-relaxed mt-2">{pattern.text}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">Blueprints</h3>
            {chapters.length > 0 && (
              <span className="text-xs text-gray-500">New blueprints append after existing chapters</span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {COURSE_BLUEPRINTS.map((blueprint) => (
              <button
                key={blueprint.id}
                type="button"
                onClick={() => onApplyBlueprint(blueprint)}
                disabled={isApplyingBlueprint}
                className="text-left border border-gray-800 bg-black/25 hover:border-red-500/60 disabled:opacity-60 disabled:cursor-not-allowed p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-sm font-medium">{blueprint.title}</span>
                  <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                </div>
                <p className="text-red-300/80 text-xs mt-1">{blueprint.badge}</p>
                <p className="text-gray-500 text-xs leading-relaxed mt-2">{blueprint.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">Readiness</h3>
            <span className="text-xs text-gray-500">{readyCount}/{checklist.length} complete</span>
          </div>
          <div className="space-y-2">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 border border-gray-800 bg-black/20 px-3 py-2">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-gray-200 text-sm">{item.label}</p>
                  <p className="text-gray-600 text-xs">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isApplyingBlueprint && (
        <div className="text-sm text-red-300 bg-red-950/20 border border-red-900/40 px-3 py-2">
          Building chapters, lessons, starter exercises, and checkpoint tests...
        </div>
      )}
    </div>
  );
};

// Course Modal Component
const CourseModal = ({ course, subjects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    subject_id: course?.subject_id || '',
    description: course?.description || '',
    difficulty: course?.difficulty || 'beginner',
    estimated_hours: course?.estimated_hours || '',
    what_youll_learn: course?.what_youll_learn?.join('\n') || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
        what_youll_learn: formData.what_youll_learn.split('\n').filter(Boolean),
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
      };

      const { data: sessionData, error: sessionError } = await withSupabaseTimeout(
        supabase.auth.getSession(),
        'Admin session check timed out.'
      );
      if (sessionError) throw sessionError;
      if (!sessionData?.session) {
        throw new Error('No authenticated Supabase admin session.');
      }

      let savedCourse = null;

      if (course?.id) {
        const { data: updatedCourse, error } = await withSupabaseTimeout(
          supabase
            .from('stem_courses')
            .update(data)
            .eq('id', course.id)
            .select('*, stem_subjects(name, color)')
            .single(),
          'Course update timed out.'
        );
        if (error) throw error;
        savedCourse = updatedCourse;
      } else {
        const { data: insertedCourse, error } = await withSupabaseTimeout(
          supabase
            .from('stem_courses')
            .insert(data)
            .select('*, stem_subjects(name, color)')
            .single(),
          'Course save timed out.'
        );
        if (error) throw error;
        savedCourse = insertedCourse;
      }

      if (!savedCourse) {
        throw new Error('Supabase saved no course data. Please try again.');
      }

      onSave(savedCourse);
    } catch (error) {
      console.error('Error saving course:', error);
      setSaveError(getSupabaseErrorMessage(error, 'Could not save this course.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {course ? 'Edit Course Details' : 'New Course Details'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              This sets the course overview. Add chapters and lessons after saving.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="auto-generated-from-title"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Course Overview</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Est. Hours</label>
              <input
                type="number"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">What You'll Learn (one per line)</label>
            <textarea
              value={formData.what_youll_learn}
              onChange={(e) => setFormData({ ...formData, what_youll_learn: e.target.value })}
              rows={4}
              placeholder="Learn concept A&#10;Master skill B&#10;Understand topic C"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
          {saveError && (
            <div className="border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {saveError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Course Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Chapter Modal Component
const ChapterModal = ({ chapter, courseId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: chapter?.title || '',
    slug: chapter?.slug || '',
    description: chapter?.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        course_id: courseId,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
      };

      if (chapter?.id) {
        await supabase.from('stem_chapters').update(data).eq('id', chapter.id);
      } else {
        await supabase.from('stem_chapters').insert(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving chapter:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {chapter?.id ? 'Edit Chapter' : 'New Chapter'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lesson Modal Component
const LessonModal = ({ lesson, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    slug: lesson?.slug || '',
    lesson_type: lesson?.lesson_type || 'reading',
    summary: lesson?.summary || '',
    content: lesson?.content || '',
    video_url: lesson?.video_url || '',
    xp_reward: lesson?.xp_reward || 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const applyLessonTemplate = (template) => {
    if (
      formData.content.trim() &&
      !window.confirm('Replace the current Markdown content with this template?')
    ) {
      return;
    }

    const title = formData.title || 'Lesson Title';
    setFormData((current) => ({
      ...current,
      lesson_type: template.lesson_type,
      summary: current.summary || template.summary(title),
      content: template.buildContent(title),
      xp_reward: template.xp_reward,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        chapter_id: lesson.chapter_id,
        slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
        xp_reward: parseInt(formData.xp_reward),
      };

      if (lesson?.id) {
        await supabase.from('stem_lessons').update(data).eq('id', lesson.id);
      } else {
        await supabase.from('stem_lessons').insert(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {lesson?.id ? 'Edit Lesson' : 'New Lesson'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showPreview ? 'bg-red-600 text-white' : 'bg-black/30 text-gray-400 hover:text-white'
              }`}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={formData.lesson_type}
                onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              >
                <option value="reading">Reading</option>
                <option value="video">Video</option>
                <option value="exercise">Exercise</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Summary</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Video URL (YouTube or direct)</label>
            <input
              type="text"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or direct URL"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Content (Markdown)</label>
            <div className="mb-3 border border-gray-800 bg-black/20 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Lesson templates</p>
                  <p className="text-xs text-gray-600 mt-1">Start with a proven structure, then replace the placeholder text.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LESSON_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyLessonTemplate(template)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-700 bg-black/30 text-gray-300 hover:text-white hover:border-red-500/60 text-xs transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {template.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={showPreview ? 'grid grid-cols-2 gap-4' : ''}>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={16}
                placeholder="## Lesson Title&#10;&#10;Your lesson content in Markdown..."
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none font-mono text-sm"
              />
              {showPreview && (
                <div className="bg-black/40 rounded-lg p-4 border border-gray-700 overflow-y-auto max-h-[400px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
                      p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="text-gray-300">{children}</li>,
                      code: ({inline, children}) => inline
                        ? <code className="bg-red-900/30 px-1.5 py-0.5 rounded text-red-300 text-sm">{children}</code>
                        : <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto"><code className="text-gray-300 text-sm">{children}</code></pre>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-red-500 pl-4 italic text-gray-400">{children}</blockquote>,
                      strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                      em: ({children}) => <em className="text-gray-200">{children}</em>,
                      table: ({children}) => <table className="w-full border-collapse mb-4">{children}</table>,
                      th: ({children}) => <th className="border border-gray-700 px-3 py-2 text-white bg-black/30 text-left text-sm">{children}</th>,
                      td: ({children}) => <td className="border border-gray-700 px-3 py-2 text-gray-300 text-sm">{children}</td>,
                    }}
                  >
                    {formData.content || '*Start typing to see preview...*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">XP Reward</label>
            <input
              type="number"
              value={formData.xp_reward}
              onChange={(e) => setFormData({ ...formData, xp_reward: e.target.value })}
              className="w-24 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Exercise Modal Component
const ExerciseModal = ({ exercise, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    exercise_type: exercise?.exercise_type || 'multiple_choice',
    question: exercise?.question || '',
    options: exercise?.options ? exercise.options.join('\n') : '',
    correct_answer: exercise?.correct_answer || '',
    hint: exercise?.hint || '',
    explanation: exercise?.explanation || '',
    order_index: exercise?.order_index || 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        lesson_id: exercise.lesson_id,
        exercise_type: formData.exercise_type,
        question: formData.question,
        options: formData.exercise_type === 'multiple_choice'
          ? formData.options.split('\n').filter(Boolean)
          : null,
        correct_answer: formData.correct_answer,
        hint: formData.hint || null,
        explanation: formData.explanation || null,
        order_index: parseInt(formData.order_index) || 0,
      };

      if (exercise?.id) {
        await supabase.from('stem_exercises').update(data).eq('id', exercise.id);
      } else {
        await supabase.from('stem_exercises').insert(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving exercise:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {exercise?.id ? 'Edit Exercise' : 'New Exercise'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={formData.exercise_type}
                onChange={(e) => setFormData({ ...formData, exercise_type: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="numeric">Numeric</option>
                <option value="fill_blank">Fill in the Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Order</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Question</label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
              required
            />
          </div>
          {formData.exercise_type === 'multiple_choice' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Options (one per line)</label>
              <textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                rows={4}
                placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Correct Answer {formData.exercise_type === 'multiple_choice' && '(must match one option exactly)'}
            </label>
            <input
              type="text"
              value={formData.correct_answer}
              onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hint (optional)</label>
            <input
              type="text"
              value={formData.hint}
              onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Explanation (shown after answer)</label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Chapter Test Modal Component
const ChapterTestModal = ({ chapter, onClose, onSave }) => {
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTestData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: testData } = await supabase
        .from('stem_chapter_tests')
        .select('*')
        .eq('chapter_id', chapter.id)
        .single();

      if (testData) {
        setTest(testData);
        const { data: questionsData } = await supabase
          .from('stem_test_questions')
          .select('*')
          .eq('test_id', testData.id)
          .order('order_index');
        setQuestions(questionsData || []);
      }
    } catch (error) {
      // No test exists yet — that's OK
    } finally {
      setIsLoading(false);
    }
  }, [chapter.id]);

  useEffect(() => {
    fetchTestData();
  }, [fetchTestData]);

  const createTest = async () => {
    setIsSaving(true);
    try {
      const { data } = await supabase
        .from('stem_chapter_tests')
        .insert({ chapter_id: chapter.id, title: `${chapter.title} Test`, passing_score: 70 })
        .select()
        .single();
      setTest(data);
    } catch (error) {
      console.error('Error creating test:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveQuestion = async (questionData) => {
    setIsSaving(true);
    try {
      const data = {
        test_id: test.id,
        question: questionData.question,
        question_type: questionData.question_type,
        options: questionData.question_type === 'multiple_choice'
          ? questionData.options.split('\n').filter(Boolean)
          : null,
        correct_answer: questionData.correct_answer,
        explanation: questionData.explanation || null,
        points: parseInt(questionData.points) || 1,
        order_index: parseInt(questionData.order_index) || 0,
      };

      if (questionData.id) {
        await supabase.from('stem_test_questions').update(data).eq('id', questionData.id);
      } else {
        await supabase.from('stem_test_questions').insert(data);
      }
      setShowQuestionForm(false);
      setEditingQuestion(null);
      fetchTestData();
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await supabase.from('stem_test_questions').delete().eq('id', questionId);
      fetchTestData();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Chapter Test: {chapter.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : !test ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No test exists for this chapter yet.</p>
              <button
                onClick={createTest}
                disabled={isSaving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create Chapter Test'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Passing score: {test.passing_score}%</p>
                  <p className="text-gray-500 text-xs">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowQuestionForm(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div key={q.id} className="p-3 bg-black/30 rounded-lg border border-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-gray-500 text-xs">{qIdx + 1}. ({q.question_type.replace('_', ' ')}) — {q.points} pt{q.points !== 1 ? 's' : ''}</span>
                      <p className="text-white text-sm mt-1">{q.question}</p>
                      <p className="text-green-400 text-xs mt-1">Answer: {q.correct_answer}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingQuestion({
                            ...q,
                            options: q.options ? q.options.join('\n') : '',
                          });
                          setShowQuestionForm(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {showQuestionForm && (
                <TestQuestionForm
                  question={editingQuestion}
                  onSave={saveQuestion}
                  onCancel={() => {
                    setShowQuestionForm(false);
                    setEditingQuestion(null);
                  }}
                  isSaving={isSaving}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Test Question Inline Form
const TestQuestionForm = ({ question, onSave, onCancel, isSaving }) => {
  const [formData, setFormData] = useState({
    id: question?.id || null,
    question_type: question?.question_type || 'multiple_choice',
    question: question?.question || '',
    options: question?.options || '',
    correct_answer: question?.correct_answer || '',
    explanation: question?.explanation || '',
    points: question?.points || 1,
    order_index: question?.order_index || 0,
  });

  return (
    <div className="p-4 bg-purple-900/10 border border-purple-900/30 rounded-lg space-y-3">
      <h4 className="text-purple-400 text-sm font-medium">{question?.id ? 'Edit Question' : 'New Question'}</h4>
      <div className="grid grid-cols-3 gap-3">
        <select
          value={formData.question_type}
          onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
          className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="numeric">Numeric</option>
        </select>
        <input
          type="number"
          value={formData.points}
          onChange={(e) => setFormData({ ...formData, points: e.target.value })}
          placeholder="Points"
          className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
        />
        <input
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
          placeholder="Order"
          className="px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
        />
      </div>
      <textarea
        value={formData.question}
        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
        rows={2}
        placeholder="Question text..."
        className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none resize-none"
        required
      />
      {formData.question_type === 'multiple_choice' && (
        <textarea
          value={formData.options}
          onChange={(e) => setFormData({ ...formData, options: e.target.value })}
          rows={3}
          placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
          className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none resize-none"
        />
      )}
      <input
        type="text"
        value={formData.correct_answer}
        onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
        placeholder="Correct answer"
        className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
        required
      />
      <input
        type="text"
        value={formData.explanation}
        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
        placeholder="Explanation (optional)"
        className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-sm focus:border-red-500 focus:outline-none"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-gray-400 hover:text-white text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(formData)}
          disabled={isSaving || !formData.question || !formData.correct_answer}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </div>
  );
};

// Textbook Manager Component
const TextbookManager = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ data: textbooksData }, { data: subjectsData }] = await Promise.all([
        supabase.from('stem_textbooks').select('*, stem_subjects(name)').order('created_at', { ascending: false }),
        supabase.from('stem_subjects').select('*').order('order_index'),
      ]);
      setTextbooks(textbooksData || []);
      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error fetching textbooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTextbook = async (id) => {
    if (!window.confirm('Delete this textbook?')) return;
    try {
      await supabase.from('stem_textbooks').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting textbook:', error);
    }
  };

  const togglePublish = async (textbook) => {
    try {
      await supabase
        .from('stem_textbooks')
        .update({ is_published: !textbook.is_published })
        .eq('id', textbook.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Textbooks</h2>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Upload Textbook
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : textbooks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No textbooks uploaded yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {textbooks.map((book) => (
            <div
              key={book.id}
              className="bg-black/40 rounded-lg border border-red-900/30 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-medium">{book.title}</h3>
                  <p className="text-gray-500 text-sm">{book.author}</p>
                  <p className="text-gray-600 text-xs mt-1">{book.stem_subjects?.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePublish(book)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    {book.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingItem(book);
                      setShowModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTextbook(book.id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TextbookModal
          textbook={editingItem}
          subjects={subjects}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingItem(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Textbook Modal
const TextbookModal = ({ textbook, subjects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: textbook?.title || '',
    author: textbook?.author || '',
    subject_id: textbook?.subject_id || '',
    description: textbook?.description || '',
    file_url: textbook?.file_url || '',
    cover_url: textbook?.cover_url || '',
    page_count: textbook?.page_count || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        ...formData,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
      };

      if (textbook?.id) {
        await supabase.from('stem_textbooks').update(data).eq('id', textbook.id);
      } else {
        await supabase.from('stem_textbooks').insert(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving textbook:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1b23] rounded-xl border border-red-900/30 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">
            {textbook ? 'Edit Textbook' : 'Upload Textbook'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">PDF URL (Supabase Storage)</label>
            <input
              type="text"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cover Image URL</label>
            <input
              type="text"
              value={formData.cover_url}
              onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Page Count</label>
            <input
              type="number"
              value={formData.page_count}
              onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
              className="w-24 px-3 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Total enrollments
      const { count: enrollmentCount } = await supabase
        .from('stem_enrollments')
        .select('*', { count: 'exact', head: true });

      // Total certificates
      const { count: certCount } = await supabase
        .from('stem_certificates')
        .select('*', { count: 'exact', head: true });

      // Total test attempts
      const { count: attemptCount } = await supabase
        .from('stem_test_attempts')
        .select('*', { count: 'exact', head: true });

      // Passed test attempts
      const { count: passedCount } = await supabase
        .from('stem_test_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('passed', true);

      // Total completed lessons
      const { count: completedLessons } = await supabase
        .from('stem_lesson_progress')
        .select('*', { count: 'exact', head: true })
        .not('completed_at', 'is', null);

      setStats({
        enrollments: enrollmentCount || 0,
        certificates: certCount || 0,
        testAttempts: attemptCount || 0,
        testsPassed: passedCount || 0,
        passRate: attemptCount > 0 ? Math.round((passedCount / attemptCount) * 100) : 0,
        completedLessons: completedLessons || 0,
      });

      // Per-course stats
      const { data: courses } = await supabase
        .from('stem_courses')
        .select('id, title, slug, is_published, stem_subjects(name, color)')
        .order('order_index');

      if (courses) {
        const courseIds = courses.map(c => c.id);

        // Enrollments per course
        const { data: enrollments } = await supabase
          .from('stem_enrollments')
          .select('course_id')
          .in('course_id', courseIds);

        const enrollMap = {};
        (enrollments || []).forEach(e => {
          enrollMap[e.course_id] = (enrollMap[e.course_id] || 0) + 1;
        });

        // Certificates per course
        const { data: certs } = await supabase
          .from('stem_certificates')
          .select('course_id')
          .in('course_id', courseIds);

        const certMap = {};
        (certs || []).forEach(c => {
          certMap[c.course_id] = (certMap[c.course_id] || 0) + 1;
        });

        setCourseStats(courses.map(c => ({
          ...c,
          enrollments: enrollMap[c.id] || 0,
          certificates: certMap[c.id] || 0,
          completionRate: enrollMap[c.id] > 0
            ? Math.round(((certMap[c.id] || 0) / enrollMap[c.id]) * 100)
            : 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-400 text-center py-12">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Enrollments', value: stats?.enrollments, color: 'text-blue-400', border: 'border-blue-900/30' },
          { label: 'Lessons Done', value: stats?.completedLessons, color: 'text-green-400', border: 'border-green-900/30' },
          { label: 'Certificates', value: stats?.certificates, color: 'text-yellow-400', border: 'border-yellow-900/30' },
          { label: 'Test Attempts', value: stats?.testAttempts, color: 'text-purple-400', border: 'border-purple-900/30' },
          { label: 'Tests Passed', value: stats?.testsPassed, color: 'text-emerald-400', border: 'border-emerald-900/30' },
          { label: 'Pass Rate', value: `${stats?.passRate}%`, color: 'text-orange-400', border: 'border-orange-900/30' },
        ].map((card, idx) => (
          <div key={idx} className={`bg-black/40 rounded-lg p-4 border ${card.border}`}>
            <p className="text-gray-500 text-xs mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Per-Course Table */}
      <div className="bg-black/40 rounded-xl border border-red-900/30 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-bold text-white">Course Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-gray-400 text-xs font-medium">Course</th>
                <th className="px-4 py-3 text-gray-400 text-xs font-medium">Subject</th>
                <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Enrollments</th>
                <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Certificates</th>
                <th className="px-4 py-3 text-gray-400 text-xs font-medium text-right">Completion %</th>
                <th className="px-4 py-3 text-gray-400 text-xs font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.map((course) => (
                <tr key={course.id} className="border-b border-gray-800/50 hover:bg-black/20">
                  <td className="px-4 py-3 text-white text-sm font-medium">{course.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: (course.stem_subjects?.color || '#666') + '80' }}
                    >
                      {course.stem_subjects?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-400 text-sm text-right font-medium">{course.enrollments}</td>
                  <td className="px-4 py-3 text-yellow-400 text-sm text-right font-medium">{course.certificates}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                      <span className="text-green-400 text-xs w-8 text-right">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {course.is_published ? (
                      <span className="text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">Live</span>
                    ) : (
                      <span className="text-gray-500 text-xs bg-gray-800 px-2 py-0.5 rounded">Draft</span>
                    )}
                  </td>
                </tr>
              ))}
              {courseStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No courses yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default STEMAdminPage;
