const mockRpc = jest.fn();

jest.mock('../supabaseClient', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

import {
  checkScienceQuestionAnswer,
  completeScienceLesson,
  enrollInScienceCourse,
  submitScienceQuizAttempt,
} from './scienceApi';

describe('secured Science API writes', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockRpc.mockResolvedValue({ data: { ok: true }, error: null });
  });

  test('enrollment derives the user and learner role on the server', async () => {
    await enrollInScienceCourse('course-id');

    expect(mockRpc).toHaveBeenCalledWith('enroll_in_science_course', {
      p_course_id: 'course-id',
    });
  });

  test('lesson completion sends no client-controlled XP or progress values', async () => {
    await completeScienceLesson({
      lessonId: 'lesson-id',
      userId: 'ignored-user',
      xpReward: 999999,
      progressPercent: 100,
    });

    expect(mockRpc).toHaveBeenCalledWith('complete_science_lesson', {
      p_lesson_id: 'lesson-id',
    });
  });

  test('quiz submission sends answers but no score, pass flag, or user id', async () => {
    const serverResult = { score: 50, passed: false, questionResults: [] };
    mockRpc.mockResolvedValueOnce({ data: serverResult, error: null });

    const result = await submitScienceQuizAttempt({
      quizId: 'quiz-id',
      answers: { 'question-id': 'answer' },
      userId: 'ignored-user',
      results: { score: 100, passed: true, totalPoints: 999 },
    });

    expect(mockRpc).toHaveBeenCalledWith('submit_science_quiz_attempt', {
      p_quiz_id: 'quiz-id',
      p_answers: { 'question-id': 'answer' },
    });
    expect(result).toEqual(serverResult);
  });

  test('inline exercises are checked through the server RPC', async () => {
    await checkScienceQuestionAnswer({ questionId: 'question-id', answer: '42' });

    expect(mockRpc).toHaveBeenCalledWith('check_science_question', {
      p_question_id: 'question-id',
      p_answer: '42',
    });
  });
});
