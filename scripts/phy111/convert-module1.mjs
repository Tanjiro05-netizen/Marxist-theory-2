#!/usr/bin/env node
// Convert the iOS PHY111 Module 1 study-course package into an idempotent
// science_v2 seed migration. Run from the repo root:
//   node scripts/phy111/convert-module1.mjs
// Output: supabase/migrations/20260910130000_seed_phy111_module1.sql
//
// All UUIDs are deterministic (UUIDv5 over the iOS content ID) so the seed
// can be re-applied safely (ON CONFLICT DO NOTHING / DO UPDATE).

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(HERE, '..', '..', 'supabase', 'migrations', '20260910130000_seed_phy111_module1.sql');

// --- deterministic UUIDs ----------------------------------------------------
const NAMESPACE_BYTES = Uint8Array.from(
  '6d6172786973742e696e666f3a706879313131'.match(/../g).map((byte) => parseInt(byte, 16))
);
const uuid5 = (name) => {
  const data = Buffer.concat([NAMESPACE_BYTES, Buffer.from(`${name}`, 'utf8')]);
  const digest = createHash('sha1').update(data).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString('hex', 0, 16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

// --- SQL helpers ------------------------------------------------------------
// Postgres runs with standard_conforming_strings=on: backslashes are literal
// in plain '...' strings, so only single quotes need escaping here.
const sqlString = (value) => (value == null ? 'NULL' : `'${`${value}`.replace(/'/g, "''")}'`);
const sqlJson = (value) => `'${JSON.stringify(value ?? {}).replace(/'/g, "''")}'::jsonb`;
const sqlInt = (value) => (value == null ? 'NULL' : `${Math.round(Number(value))}`);

const lines = [];
const emit = (sql) => lines.push(sql);
const questions = []; // { id, type, prompt, options, answer, tolerance, explanation, hint, tags, difficulty }
const blocksOut = []; // deferred block inserts (need lesson ids known first — we keep ordered arrays)

// --- load sources -----------------------------------------------------------
const pkg = JSON.parse(readFileSync(join(HERE, 'PHY111_Module1_Public_Beta.study-course.json'), 'utf8'));
const readCsv = (file) =>
  readFileSync(join(HERE, file), 'utf8')
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((row) => row.split(',').map((cell) => Number(cell)));
const fallbackMotion = readCsv('PHY111_Module1_Fallback_Motion.csv'); // frame, time_s, position_m
const accelerationSeries = readCsv('PHY111_Module1_Acceleration_Series.csv'); // time_s, acceleration

const course = pkg.courses[0];
const module1 = course.modules[0];
const activitiesById = new Map(pkg.interactiveActivities.map((activity) => [activity.id, activity]));
const itemsById = new Map(pkg.scienceAssessmentItems.map((item) => [item.id, item]));
const videosById = new Map((pkg.videos || []).map((video) => [video.id, video]));
const assessmentsById = new Map((pkg.assessments || []).map((assessment) => [assessment.id, assessment]));

// --- identifiers -------------------------------------------------------------
const COURSE_ID = uuid5('course:PHY111');
const BANK_ID = uuid5('bank:PHY111.module1');
const SUBJECT_ID = null; // resolved at runtime from slug 'physics' below
const moduleIdFor = { foundations: uuid5('module:foundations'), module1: uuid5('module:module-1') };
const lessonIdFor = (lesson) => uuid5(`lesson:${lesson.id}`);

// --- FBD targets authored during conversion ----------------------------------
// The iOS package leaves diagrams open-ended (minimum force counts only); these
// canonical diagrams follow the course's own FBD discipline.
const fbdTargets = {
  'PHY111.activity.m01.guided.1B': [
    {
      id: 'book',
      scenario: 'A book rests motionless on a horizontal table. Draw the forces acting **on the book**.',
      bodyLabel: 'book',
      target: [
        { label: 'Weight (earth on book)', angle: -90 },
        { label: 'Normal force (table on book)', angle: 90 },
      ],
    },
    {
      id: 'sled',
      scenario: 'A sled is pulled along level snow by a rope angled 30° above the horizontal. Draw the forces acting **on the sled** (rope pulls to the right).',
      bodyLabel: 'sled',
      target: [
        { label: 'Weight (earth on sled)', angle: -90 },
        { label: 'Normal force (snow on sled)', angle: 90 },
        { label: 'Tension (rope on sled)', angle: 30 },
        { label: 'Friction (snow on sled)', angle: 180 },
      ],
    },
    {
      id: 'falling-ball',
      scenario: 'A ball falls straight down at terminal speed, so air drag balances weight. Draw the forces acting **on the ball**.',
      bodyLabel: 'ball',
      target: [
        { label: 'Weight (earth on ball)', angle: -90 },
        { label: 'Air drag (air on ball)', angle: 90 },
      ],
    },
    {
      id: 'pulley-block',
      scenario: 'Two blocks hang from a pulley. Choose the **rising** block and draw only the forces acting on it.',
      bodyLabel: 'block',
      target: [
        { label: 'Weight (earth on block)', angle: -90 },
        { label: 'Tension (rope on block)', angle: 90 },
      ],
    },
  ],
};
const fbdPalette = [
  'Weight (earth on object)',
  'Normal force (surface on object)',
  'Friction (surface on object)',
  'Tension (rope on object)',
  'Air drag (air on object)',
  'Weight (earth on book)',
  'Weight (earth on sled)',
  'Weight (earth on ball)',
  'Weight (earth on block)',
  'Normal force (table on book)',
  'Normal force (snow on sled)',
  'Tension (rope on sled)',
  'Friction (snow on sled)',
  'Tension (rope on block)',
  'Air drag (air on ball)',
  'Applied force',
];

// --- block converters ---------------------------------------------------------
const blockCounter = { order: 0 };
const resetOrder = () => {
  blockCounter.order = 0;
};
const nextOrder = () => sqlInt(blockCounter.order++);

const richText = (title, body) => ({
  block_type: 'rich_text',
  title: title || null,
  content_json: { body },
});

const callout = (title, body, variant = 'intuition') => ({
  block_type: 'callout',
  title: title || null,
  content_json: { variant, body },
});

function convertNumericQuantity(activity) {
  const parts = activity.configuration?.details?.parts || [];
  const responseNote = activity.configuration?.details?.responseInstructionsMarkdown;
  return parts.map((part) => {
    const questionId = uuid5(`question:${activity.id}:${part.id}`);
    const answer = part.answer || {};
    const tolerance =
      answer.absoluteTolerance != null
        ? answer.absoluteTolerance
        : answer.relativeTolerance != null
          ? Math.abs(answer.relativeTolerance * answer.canonicalValue)
          : 0.005 * Math.abs(answer.canonicalValue || 1);
    questions.push({
      id: questionId,
      question_type: 'numeric',
      prompt: `${part.promptMarkdown || activity.title}\n\n${activity.instructionsMarkdown || ''}`.trim(),
      options: null,
      answer: `${answer.canonicalValue}`,
      tolerance,
      explanation: responseNote || null,
      hint: null,
      tags: ['phy111', 'module-1', activity.kind],
      difficulty: 'intermediate',
      unit: answer.canonicalUnitID,
    });
    return {
      block_type: 'exercise',
      title: `${activity.title}${parts.length > 1 ? ` — ${part.label}` : ''}`,
      content_json: { question_id: questionId },
      config_json: { unit: answer.canonicalUnitID },
    };
  });
}

function convertConstructedResponse(activity) {
  const details = activity.configuration?.details || {};
  const prompts = details.prompts || [];
  const selfReview = details.selfReviewPrompts || [];
  const promptBody = prompts.map((prompt) => `- ${prompt}`).join('\n');
  return [
    {
      block_type: 'constructed_response',
      title: activity.title,
      content_json: {
        prompt: promptBody || activity.summary,
        guidance: activity.instructionsMarkdown || null,
        modelAnswer: prompts.length > 0 ? null : activity.summary,
        rubric: selfReview.map((label, index) => ({ id: `r${index}`, label })),
        minChars: details.minimumResponseCharacters || 20,
      },
      config_json: { min_chars: details.minimumResponseCharacters || 20 },
    },
  ];
}

function convertWorkedExample(activity) {
  const details = activity.configuration?.details || {};
  return [
    {
      block_type: 'worked_example_studio',
      title: activity.title,
      content_json: {
        problem: details.problemMarkdown,
        prompt: activity.summary || 'Attempt the problem before revealing the solution.',
        steps: (details.solutionMarkdown || '').split('\n').filter((line) => line.trim()),
        answer: details.resultMarkdown,
        interpretation: details.interpretationMarkdown,
      },
      config_json: { min_attempt_chars: details.minimumAttemptCharacters || 40 },
    },
  ];
}

function convertGraphTable(activity) {
  const details = activity.configuration?.details || {};
  const columns = (details.columns || []).map((column) => ({
    key: column.id,
    label: column.title,
    unit: column.unitID === '1' ? null : column.unitID,
  }));
  const rows = (details.initialRows || []).map((row) => row.map((cell) => (cell === '' ? '' : cell)));
  const prompts = [
    ...(details.numericPrompts || []).map((prompt) => {
      const answer = prompt.answer || {};
      return {
        id: prompt.id,
        prompt: `${prompt.promptMarkdown} (${prompt.label})`,
        type: 'numeric',
        answer: answer.canonicalValue,
        tolerance: answer.absoluteTolerance ?? Math.abs((answer.relativeTolerance || 0.01) * answer.canonicalValue),
        unit: answer.canonicalUnitID,
      };
    }),
    ...(details.responsePrompts || []).map((prompt, index) => ({
      id: `text-${index}`,
      prompt,
      type: 'text',
    })),
  ];
  return [
    {
      block_type: 'graph_table_lab',
      title: activity.title,
      content_json: {
        instructions: activity.instructionsMarkdown || details.promptMarkdown,
        columns,
        rows,
        series: (details.series || []).map((series) => ({
          xKey: series.xColumnID,
          yKey: series.yColumnID,
          label: series.title,
        })),
        prompts,
        fit: null,
      },
      config_json: { min_rows: details.minimumRows || rows.length },
    },
  ];
}

function convertFreeBodyDiagram(activity) {
  const details = activity.configuration?.details || {};
  const targets = fbdTargets[activity.id] || [];
  const selfReview = details.selfReviewPrompts || [];
  if (targets.length === 0) {
    // No authored canonical diagrams: fall back to a guided practice block.
    return [
      {
        block_type: 'constructed_response',
        title: activity.title,
        content_json: {
          prompt: (details.scenarios || []).map((scenario) => `- **${scenario.title}:** ${scenario.situationMarkdown}`).join('\n'),
          guidance: `Draw each diagram on paper, then describe your diagrams and their force sources in the response. ${activity.instructionsMarkdown || ''}`.trim(),
          rubric: selfReview.map((label, index) => ({ id: `r${index}`, label })),
          minChars: 60,
        },
        config_json: { min_chars: 60 },
      },
    ];
  }
  return targets.map((target) => ({
    block_type: 'fbd_builder',
    title: `${activity.title} — ${target.id.replace(/-/g, ' ')}`,
    content_json: {
      scenario: target.scenario,
      bodyLabel: target.bodyLabel,
      palette: fbdPalette,
      target: target.target,
      angleTolerance: 15,
      hints: selfReview.slice(0, 2),
    },
    config_json: {},
  }));
}

function convertErrorDiagnosis(activity) {
  const details = activity.configuration?.details || {};
  return [
    {
      block_type: 'debug_task',
      title: activity.title,
      content_json: {
        scenario: activity.summary,
        flawedSteps: [details.flawedSolutionMarkdown].filter(Boolean),
        prompts: (details.requiredResponsePrompts || []).map((prompt, index) => ({
          id: `p${index}`,
          prompt,
          minChars: 15,
        })),
        feedback: details.selfReviewMarkdown,
        errorClass: 'model',
        taxonomy: 'model',
      },
      config_json: { min_chars: 15 },
    },
  ];
}

function convertMotionTrackingLab(activity) {
  const details = activity.configuration?.details || {};
  const reportPrompts = (details.requiredReportFields || []).map((field, index) => ({
    id: `report-${index}`,
    prompt: `Report — ${field.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}:`,
    type: 'text',
  }));
  return [
    {
      block_type: 'motion_lab',
      title: activity.title,
      content_json: {
        instructions: `${activity.instructionsMarkdown || ''}\n\n**Safety:** ${(details.safetyMarkdown || '').trim()}\n\nIf you cannot film a motion safely, analyse the bundled fallback observations below — the same analysis applies.`,
        dataset: {
          label: 'Module 1 fallback observations',
          description: 'Thirty-one calibrated position-time observations at 0.1 s intervals with small measurement deviations.',
          xUnit: 's',
          yUnit: 'm',
          rows: fallbackMotion.map((row) => [row[1], row[2]]),
        },
        prompts: reportPrompts,
      },
      config_json: { min_points: details.minimumSampleCount || 20 },
    },
  ];
}

function convertNumericalKinematics(activity, { extension = false } = {}) {
  const details = activity.configuration?.details || {};
  const checks = (details.requiredValidationSteps || []).map((step, index) => ({
    id: `v${index}`,
    label: step,
  }));
  const tMax = accelerationSeries.length > 0 ? accelerationSeries[accelerationSeries.length - 1][0] : 2;
  return [
    {
      block_type: 'sim_lab',
      title: extension ? `${activity.title} (extension)` : activity.title,
      content_json: {
        intro: `${activity.summary || ''}\n\n**Position update:** ${details.positionUpdateMarkdown || 'xₙ₊₁ = xₙ + vₙΔt'} · **Velocity update:** ${details.velocityUpdateMarkdown || 'vₙ₊₁ = vₙ + aₙΔt'}${extension ? '\n\n*Extension variant: explore how the time step controls the error — halve Δt and compare the final-time error, as in the validation rule.*' : ''}`,
        model: {
          kind: 'kinematics_euler',
          dataset: accelerationSeries.map((row) => [row[0], row[1]]),
          defaults: {
            x0: details.initialPosition ?? 0,
            v0: details.initialVelocity ?? 0.6,
            dt: details.defaultTimeStep ?? 0.1,
            tMax: Math.max(2, Math.ceil(tMax)),
            analyticOverlay: true,
          },
        },
        sliders: [
          { id: 'dt', label: 'Time step Δt', min: 0.01, max: 0.2, step: 0.01, value: details.defaultTimeStep ?? 0.1, unit: 's' },
          { id: 'v0', label: 'Initial velocity v₀', min: 0, max: 2, step: 0.1, value: details.initialVelocity ?? 0.6, unit: 'm/s' },
          { id: 'x0', label: 'Initial position x₀', min: 0, max: 2, step: 0.1, value: details.initialPosition ?? 0, unit: 'm' },
          { id: 'tMax', label: 'Run duration', min: 1, max: 6, step: 0.5, value: Math.max(2, Math.ceil(tMax)), unit: 's' },
        ],
        predictions: [
          {
            id: 'pred-error',
            prompt: 'Predict first: will the Euler position at the final time sit above or below the analytic x(t) = x₀ + v₀t + ½at², and why?',
          },
        ],
        checks,
      },
      config_json: { allow_rerun: true },
    },
  ];
}

function convertMathExpression(activity) {
  const details = activity.configuration?.details || {};
  return [
    {
      block_type: 'constructed_response',
      title: activity.title,
      content_json: {
        prompt: `${activity.instructionsMarkdown || ''}\n\n${details.promptMarkdown || ''}`.trim(),
        modelAnswer: details.feedbackMarkdown,
        rubric: [{ id: 'r0', label: 'The elimination steps are shown, not just the final relation.' }],
        minChars: 30,
      },
      config_json: { min_chars: 30 },
    },
  ];
}

function convertAcknowledgement(activity) {
  const details = activity.configuration?.details || {};
  return [
    {
      block_type: 'constructed_response',
      title: activity.title,
      content_json: {
        prompt: `${details.statementMarkdown || ''}\n\nIn your own words, confirm the standard and how you will apply it:`,
        modelAnswer: details.acknowledgementLabel,
        rubric: [],
        minChars: details.acknowledgementLabel ? 10 : 20,
      },
      config_json: { min_chars: 10 },
    },
  ];
}

function convertActivity(activity) {
  switch (activity.kind) {
    case 'workedExample':
      return convertWorkedExample(activity);
    case 'constructedResponse':
      return convertConstructedResponse(activity);
    case 'numericQuantity':
      return convertNumericQuantity(activity);
    case 'graphTable':
      return convertGraphTable(activity);
    case 'freeBodyDiagram':
      return convertFreeBodyDiagram(activity);
    case 'errorDiagnosis':
      return convertErrorDiagnosis(activity);
    case 'motionTrackingLab':
      return convertMotionTrackingLab(activity);
    case 'numericalKinematics':
      return convertNumericalKinematics(activity);
    case 'pythonNotebook':
      // Python is out of scope for the web v1; the same learning goals are
      // served by a second parameter-play lab with a time-step focus.
      return convertNumericalKinematics(activity, { extension: true });
    case 'mathExpression':
      return convertMathExpression(activity);
    case 'acknowledgement':
      return convertAcknowledgement(activity);
    default:
      return [callout(activity.title, activity.summary || `Activity ${activity.id} (${activity.kind}) is not available in the web edition.`)];
  }
}

// --- assessment conversion -----------------------------------------------------
// Objective items become server-graded multiple-choice questions; constructed
// items become constructed_response blocks shown next to the quiz.
function convertAssessment(assessmentId, slug, quizType, lessonId) {
  const assessment = assessmentsById.get(assessmentId);
  if (!assessment) return { quiz: null, blocks: [], questionLinks: [] };
  const items = (assessment.scienceAssessmentItemIDs || []).map((id) => itemsById.get(id)).filter(Boolean);
  const objective = items.filter((item) => item.kind === 'objectiveChoice');
  const constructed = items.filter((item) => item.kind === 'constructedResponse');

  const questionLinks = [];
  objective.forEach((item) => {
    const questionId = uuid5(`question:${item.id}`);
    const correctLabel = (item.options || []).find((option) => (item.correctOptionIDs || []).includes(option.id))?.label || '';
    questions.push({
      id: questionId,
      question_type: 'multiple_choice',
      prompt: item.promptMarkdown,
      options: (item.options || []).map((option) => option.label),
      answer: correctLabel,
      tolerance: null,
      explanation: null,
      hint: null,
      tags: ['phy111', 'module-1', slug],
      difficulty: 'intermediate',
    });
    questionLinks.push({ quizSlug: slug, questionId, order: questionLinks.length, points: item.points || 1 });
  });

  const passPolicy = assessment.sciencePassPolicy;
  // Score rounds to an integer (5/6 -> 83), so the floor keeps 5 correct passing.
  const passPercent =
    passPolicy && passPolicy.scorableItemCount
      ? Math.floor((passPolicy.minimumCorrectCount / passPolicy.scorableItemCount) * 100)
      : 70;

  const quiz = {
    id: uuid5(`quiz:${assessmentId}`),
    slug,
    title: assessment.title,
    description: `${assessment.permittedMaterials || ''}${assessment.recommendedTimeMaximumMinutes ? ` Suggested time: about ${assessment.recommendedTimeMaximumMinutes} minutes (untimed on the web edition).` : ''}`.trim(),
    quiz_type: quizType,
    passing_score: passPercent,
    attempts_allowed: assessment.unlimitedRetries ? 0 : 3,
    feedback_policy: 'after_submit',
    lesson_id: lessonId,
  };

  const blocks = constructed.map((item) => ({
    block_type: 'constructed_response',
    title: 'Written response',
    content_json: {
      prompt: item.promptMarkdown,
      modelAnswer: item.rubricMarkdown,
      rubric: [{ id: 'r0', label: 'My response meets the rubric described above.' }],
      minChars: item.minimumResponseCharacters || 20,
    },
    config_json: { min_chars: item.minimumResponseCharacters || 20 },
  }));

  return { quiz, blocks, questionLinks, constructedRequired: constructed.length };
}

// --- assemble lessons -----------------------------------------------------------
const lessonPlan = {
  // iOS lesson id -> { moduleKey, lessonKind, slug }
  'PHY111.lesson.orientation': { moduleKey: 'foundations', lessonKind: 'concept', slug: 'orientation' },
  'PHY111.lesson.foundations': { moduleKey: 'foundations', lessonKind: 'concept', slug: 'mathematical-foundations' },
  'PHY111.lesson.m01.1.1': { moduleKey: 'module1', lessonKind: 'concept', slug: 'models-and-coordinates' },
  'PHY111.lesson.m01.1.2': { moduleKey: 'module1', lessonKind: 'concept', slug: 'velocity-and-kinematics' },
  'PHY111.lesson.m01.1.3': { moduleKey: 'module1', lessonKind: 'concept', slug: 'vectors-and-projectiles' },
  'PHY111.lesson.m01.1.4': { moduleKey: 'module1', lessonKind: 'concept', slug: 'newtons-laws-and-fbds' },
  'PHY111.lesson.m01.1.5': { moduleKey: 'module1', lessonKind: 'concept', slug: 'common-forces-and-method' },
  'PHY111.lesson.m01.guided': { moduleKey: 'module1', lessonKind: 'practice', slug: 'guided-exercises' },
  'PHY111.lesson.m01.studio': { moduleKey: 'module1', lessonKind: 'practice', slug: 'tutorial-studio' },
  'PHY111.lesson.m01.investigation': { moduleKey: 'module1', lessonKind: 'lab', slug: 'investigation' },
  'PHY111.lesson.m01.problem-set': { moduleKey: 'module1', lessonKind: 'practice', slug: 'problem-set' },
  'PHY111.lesson.m01.assess': { moduleKey: 'module1', lessonKind: 'quiz', slug: 'mastery-and-quiz' },
};

const quizRows = [];
const quizQuestionRows = [];

for (const lesson of module1.lessons) {
  const plan = lessonPlan[lesson.id];
  if (!plan) continue;
  const lessonId = lessonIdFor(lesson);
  resetOrder();

  // Opening objectives callout.
  const objectiveBody = [
    lesson.objectives?.length ? `**Learning outcomes**\n${lesson.objectives.map((objective) => `- ${objective}`).join('\n')}` : null,
    lesson.essentialQuestions?.length ? `**Essential questions**\n${lesson.essentialQuestions.map((question) => `- ${question}`).join('\n')}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
  const opening = objectiveBody ? [callout('Orientation', objectiveBody)] : [];

  const bodyBlocks = [];
  for (const block of lesson.blocks || []) {
    if (block.kind === 'lessonContent') {
      bodyBlocks.push(richText(block.title, block.bodyMarkdown));
    } else if (block.kind === 'interactiveActivity') {
      const activity = activitiesById.get(block.referencedContentID);
      if (activity) {
        activity.title = block.title || activity.title;
        bodyBlocks.push(...convertActivity(activity));
      }
    } else if (block.kind === 'video') {
      const video = videosById.get(block.referencedContentID);
      bodyBlocks.push({
        block_type: 'video',
        title: video?.title || block.title,
        content_json: { url: video?.mediaURL || null, transcript: video?.transcriptMarkdown || null },
      });
    } else if (block.kind === 'lessonCheck' || block.kind === 'moduleQuiz') {
      const slug = block.kind === 'lessonCheck' ? 'm01-mastery' : 'm01-quiz';
      const quizType = block.kind === 'lessonCheck' ? 'checkpoint' : 'practice';
      const { quiz, blocks: quizBlocks, questionLinks } = convertAssessment(block.referencedContentID, slug, quizType, lessonId);
      if (quiz) {
        quizRows.push(quiz);
        questionLinks.forEach((link) => quizQuestionRows.push({ ...link, quizId: quiz.id }));
        bodyBlocks.push({
          block_type: 'quiz',
          title: quiz.title,
          content_json: { quiz_slug: slug },
        });
        bodyBlocks.push(...quizBlocks);
      }
    }
  }

  // Closing reflection prompts.
  const closing = lesson.reflectionPrompts?.length
    ? [
        {
          block_type: 'constructed_response',
          title: 'Reflection',
          content_json: {
            prompt: lesson.reflectionPrompts.map((prompt) => `- ${prompt}`).join('\n'),
            rubric: [],
            minChars: 20,
          },
          config_json: { min_chars: 20 },
        },
      ]
    : [];

  const allBlocks = [...opening, ...bodyBlocks, ...closing];
  allBlocks.forEach((block) => {
    blocksOut.push({
      id: uuid5(`block:${lesson.id}:${blockCounter.order}`),
      lesson_id: lessonId,
      ...block,
      order_index: blockCounter.order,
    });
  });

  // stash lesson metadata for SQL emit
  lesson._web = { ...plan, id: lessonId, estimatedMinutes: lesson.estimatedMinutes };
}

// --- emit SQL -------------------------------------------------------------------
emit('-- PHY111 Module 1 seed (auto-generated from PHY111_Module1_Public_Beta.study-course.json).');
emit('-- Regenerate with: node scripts/phy111/convert-module1.mjs');
emit('-- Deterministic UUIDs; safe to re-run.');
emit('');
emit('BEGIN;');
emit('');
emit(`INSERT INTO public.science_question_banks (id, course_id, title, description, tags)`);
emit(`VALUES (${sqlString(uuid5('bank:PHY111.module1'))}, ${sqlString(COURSE_ID)}, 'PHY111 — Module 1 bank', 'Questions converted from the PHY111 Module 1 interactive package.', ARRAY['phy111'])`);
emit('ON CONFLICT (id) DO NOTHING;');
emit('');

const totalMinutes = module1.lessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes || 0), 0);
emit('-- Course');
emit(`INSERT INTO public.science_courses (id, subject_id, title, slug, subtitle, description, outcomes, prerequisites, level, estimated_minutes, language, certificate_available, status, order_index, metadata)`);
emit(`VALUES (`);
emit(`  ${sqlString(COURSE_ID)},`);
emit(`  (SELECT id FROM public.science_subjects WHERE slug = 'physics'),`);
emit(`  ${sqlString(course.title)},`);
emit(`  'phy111-introductory-physics-i',`);
emit(`  ${sqlString(course.subtitle)},`);
emit(`  ${sqlString(course.summary || course.overviewMarkdown?.slice(0, 600))},`);
emit(`  ${sqlJson(course.outcomes || [])},`);
emit(`  ${sqlJson(course.prerequisites || [])},`);
emit(`  'intermediate',`);
emit(`  ${sqlInt(totalMinutes)},`);
emit(`  'en',`);
emit(`  false,`);
emit(`  'published',`);
emit(`  10,`);
emit(
  `  ${sqlJson({
    phy111: {
      packageID: pkg.packageID,
      contentVersion: pkg.contentVersion,
      plannedModuleCount: course.plannedModuleCount,
      availableModules: ['Module 0 — Mathematical and Experimental Foundations', 'Module 1 — Newtonian Description of Motion and Force'],
      pacing: 'hybrid',
      suggestedCadence: 'One module every two weeks; Week A concepts, Week B studios, investigation, and mastery.',
      sourceTextStatus: course.sourceTextStatus,
    },
  })}`);
emit(`)`);
emit(`ON CONFLICT (slug) DO UPDATE SET`);
emit(`  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,`);
emit(`  outcomes = EXCLUDED.outcomes, prerequisites = EXCLUDED.prerequisites, estimated_minutes = EXCLUDED.estimated_minutes,`);
emit(`  metadata = EXCLUDED.metadata, status = 'published', updated_at = now();`);
emit('');

emit('-- Modules');
emit(`INSERT INTO public.science_modules (id, course_id, title, slug, description, order_index, unlock_conditions, is_published) VALUES`);
emit(`  (${sqlString(moduleIdFor.foundations)}, ${sqlString(COURSE_ID)}, 'Module 0 — Mathematical and Experimental Foundations', 'foundations', 'Units and dimensions, vectors, graphs as physics, numerical computation, measurement and uncertainty. Always open.', 0, '{}'::jsonb, true),`);
emit(`  (${sqlString(moduleIdFor.module1)}, ${sqlString(COURSE_ID)}, 'Module 1 — Newtonian Description of Motion and Force', 'module-1-newtonian-motion', 'Coordinates, vectors, forces, free-body diagrams, and Newton'\''s laws — with the motion-tracking investigation and the first computational mini-lab.', 1, '{}'::jsonb, true)`);
emit('ON CONFLICT (course_id, slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = now();');
emit('');

emit('-- Lessons');
const lessonRows = module1.lessons
  .filter((lesson) => lesson._web)
  .map((lesson, index) => {
    const web = lesson._web;
    const moduleId = moduleIdFor[web.moduleKey];
    const orderInModule = module1.lessons.filter((other) => other._web?.moduleKey === web.moduleKey).indexOf(lesson);
    return `  (${sqlString(web.id)}, ${sqlString(moduleId)}, ${sqlString(lesson.title)}, ${sqlString(web.slug)}, ${sqlString(lesson.summary)}, '${web.lessonKind}', ${sqlInt(lesson.estimatedMinutes)}, ${sqlInt(web.moduleKey === 'foundations' ? 15 : 25)}, ${sqlInt(orderInModule)}, true, true)`;
  });
emit(`INSERT INTO public.science_lessons (id, module_id, title, slug, summary, lesson_kind, estimated_minutes, xp_reward, order_index, is_required, is_published) VALUES`);
emit(lessonRows.join(',\n'));
emit('ON CONFLICT (module_id, slug) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary, lesson_kind = EXCLUDED.lesson_kind, estimated_minutes = EXCLUDED.estimated_minutes, order_index = EXCLUDED.order_index, updated_at = now();');
emit('');

emit('-- Blocks');
blocksOut.forEach((block, index) => {
  emit(`INSERT INTO public.science_lesson_blocks (id, lesson_id, block_type, title, content_json, config_json, order_index, is_required) VALUES`);
  emit(`  (${sqlString(block.id)}, ${sqlString(block.lesson_id)}, '${block.block_type}', ${sqlString(block.title)}, ${sqlJson(block.content_json)}, ${sqlJson(block.config_json || {})}, ${sqlInt(block.order_index)}, true)`);
  emit('ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content_json = EXCLUDED.content_json, config_json = EXCLUDED.config_json, order_index = EXCLUDED.order_index, updated_at = now();');
  if (index < blocksOut.length - 1) emit('');
});
emit('');

emit('-- Questions');
questions.forEach((question) => {
  emit(`INSERT INTO public.science_questions (id, bank_id, subject_id, question_type, prompt, options, hint, difficulty, tags, metadata) VALUES`);
  emit(
    `  (${sqlString(question.id)}, ${sqlString(BANK_ID)}, (SELECT id FROM public.science_subjects WHERE slug = 'physics'), '${question.question_type}', ${sqlString(question.prompt)}, ${question.options ? sqlJson(question.options) : 'NULL'}, ${sqlString(question.hint)}, '${question.difficulty}', ARRAY[${(question.tags || []).map((tag) => sqlString(tag)).join(',')}], ${sqlJson({ unit: question.unit || null })})`
  );
  emit('ON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, options = EXCLUDED.options, updated_at = now();');
  emit(`INSERT INTO private.science_question_answers (question_id, correct_answer, tolerance, explanation) VALUES`);
  emit(`  (${sqlString(question.id)}, ${sqlString(question.answer)}, ${question.tolerance != null ? sqlString(question.tolerance) : 'NULL'}, ${sqlString(question.explanation)})`);
  emit('ON CONFLICT (question_id) DO UPDATE SET correct_answer = EXCLUDED.correct_answer, tolerance = EXCLUDED.tolerance, explanation = EXCLUDED.explanation, updated_at = now();');
});
emit('');

emit('-- Quizzes');
quizRows.forEach((quiz) => {
  emit(`INSERT INTO public.science_quizzes (id, course_id, lesson_id, title, description, quiz_type, passing_score, attempts_allowed, feedback_policy, is_published, slug) VALUES`);
  emit(
    `  (${sqlString(quiz.id)}, ${sqlString(COURSE_ID)}, ${sqlString(quiz.lesson_id)}, ${sqlString(quiz.title)}, ${sqlString(quiz.description)}, '${quiz.quiz_type}', ${sqlInt(quiz.passing_score)}, ${sqlInt(quiz.attempts_allowed)}, '${quiz.feedback_policy}', true, ${sqlString(quiz.slug)})`
  );
  emit('ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, passing_score = EXCLUDED.passing_score, attempts_allowed = EXCLUDED.attempts_allowed, feedback_policy = EXCLUDED.feedback_policy, slug = EXCLUDED.slug, updated_at = now();');
});
emit('');

emit('-- Quiz questions');
if (quizQuestionRows.length > 0) {
  emit(`INSERT INTO public.science_quiz_questions (id, quiz_id, question_id, order_index, points) VALUES`);
  emit(
    quizQuestionRows
      .map((link) => `  (${sqlString(uuid5(`quizq:${link.quizId}:${link.questionId}`))}, ${sqlString(link.quizId)}, ${sqlString(link.questionId)}, ${sqlInt(link.order)}, ${sqlInt(link.points)})`)
      .join(',\n')
  );
  emit('ON CONFLICT (quiz_id, question_id) DO UPDATE SET order_index = EXCLUDED.order_index, points = EXCLUDED.points;');
}
emit('');
emit('COMMIT;');
emit('');

writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT_PATH}`);
console.log(`  lessons: ${module1.lessons.filter((lesson) => lesson._web).length}`);
console.log(`  blocks: ${blocksOut.length}`);
console.log(`  questions: ${questions.length}`);
console.log(`  quizzes: ${quizRows.length} (${quizQuestionRows.length} links)`);
