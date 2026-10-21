import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import {
  fetchScienceReviewCards,
  getScienceErrorMessage,
  rateScienceReviewCard,
} from '../services/scienceApi';
import { numericAnswerMatches } from '../utils/scienceLabMath';

// Mistakes hub: spaced-review queue over questions the learner previously
// missed. Ratings schedule the next review on the fixed 1/3/7/21-day ladder.
const RATING_LABELS = {
  again: 'science.reviewAgain',
  hard: 'science.reviewHard',
  good: 'science.reviewGood',
  easy: 'science.reviewEasy',
};

const BOX_INTERVALS = [1, 3, 7, 21];

const ScienceReviewPage = () => {
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(null);
  const [isRating, setIsRating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await fetchScienceReviewCards({ dueOnly: false });
        setCards(data);
      } catch (loadError) {
        setError(getScienceErrorMessage(loadError, t('science.reviewLoadError')));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [t]);

  const dueCards = useMemo(() => cards.filter((card) => new Date(card.dueAt) <= new Date()), [cards]);
  const upcomingCards = useMemo(() => cards.filter((card) => new Date(card.dueAt) > new Date()), [cards]);
  const card = dueCards[currentIndex];

  const reveal = () => {
    if (!card) return;
    const expected = card.reviewAnswer;
    const correct =
      expected == null
        ? null
        : card.questionType === 'numeric'
          ? numericAnswerMatches(answer, expected, card.reviewTolerance)
          : `${answer}`.trim().toLowerCase() === `${expected}`.trim().toLowerCase();
    setWasCorrect(correct);
    setRevealed(true);
  };

  const rate = async (rating) => {
    if (!card || isRating) return;
    setIsRating(true);
    try {
      await rateScienceReviewCard({ questionId: card.questionId, rating });
      setAnswer('');
      setRevealed(false);
      setWasCorrect(null);
      // Move to the next due card; drop the rated one from the due list.
      setCards((current) => current.filter((item) => item.questionId !== card.questionId));
      setCurrentIndex(0);
    } catch (rateError) {
      setError(getScienceErrorMessage(rateError, t('science.reviewRateError')));
    } finally {
      setIsRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0d12]">
        <div className="py-24 text-center text-gray-400">{t('science.reviewLoading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-gray-200">
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <Link href="/science-tech" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-5">
          <RefreshCw className="w-4 h-4 rotate-180" />
          {t('science.backToScience')}
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('science.reviewTitle')}</h1>
        <p className="text-gray-500 mb-8">{t('science.reviewSubtitle')}</p>

        {error && <div className="border border-red-900/40 bg-red-950/20 p-4 text-red-200 mb-6">{error}</div>}

        {dueCards.length === 0 ? (
          <div className="border border-gray-800 bg-black/30 p-8 text-center">
            <p className="text-white font-medium">{t('science.reviewAllCaughtUp')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('science.reviewComeBack', { count: upcomingCards.length })}</p>
          </div>
        ) : (
          <div className="border border-gray-800 bg-black/30 p-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <span>
                {t('science.reviewProgress', { current: Math.min(currentIndex + 1, dueCards.length), total: dueCards.length })}
              </span>
              <span>{t('science.reviewBox', { days: BOX_INTERVALS[card?.box ?? 0] })}</span>
            </div>

            <p className="text-white text-lg mb-4">{card?.prompt}</p>

            {card?.questionType === 'multiple_choice' || card?.questionType === 'true_false' ? (
              <div className="space-y-2">
                {(card.questionType === 'true_false' ? ['True', 'False'] : card.options || []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={revealed}
                    onClick={() => setAnswer(option)}
                    className={`w-full text-left px-3 py-2 border text-gray-200 transition-colors ${
                      answer === option ? 'border-red-900 bg-red-950/20' : 'border-gray-800 bg-black/30 hover:border-gray-600'
                    } ${revealed && card.reviewAnswer === option ? 'border-green-900 bg-green-950/20' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={card?.questionType === 'numeric' ? 'number' : 'text'}
                value={answer}
                disabled={revealed}
                onChange={(event) => setAnswer(event.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-gray-700 text-white focus:border-red-500 focus:outline-none"
                placeholder={t('science.enterAnswer')}
              />
            )}

            {card?.hint && (
              <p className="mt-3 text-sm text-gray-500">
                <span className="text-gray-600">{t('science.showHint')}:</span> {card.hint}
              </p>
            )}

            {!revealed ? (
              <button
                type="button"
                onClick={reveal}
                disabled={!answer}
                className="mt-5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-50"
              >
                {t('science.reviewCheck')}
              </button>
            ) : (
              <div className="mt-5 space-y-4">
                <div className={`border p-4 text-sm ${wasCorrect === false ? 'border-red-900/50 bg-red-950/10 text-red-200' : 'border-green-900/40 bg-green-950/10 text-gray-300'}`}>
                  {wasCorrect === false && (
                    <p className="mb-1">
                      {t('science.reviewNotQuite')} <span className="text-white">{card.reviewAnswer}</span>
                    </p>
                  )}
                  {card.explanation && <p>{card.explanation}</p>}
                  {card.tags?.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">{card.tags.join(' · ')}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">{t('science.reviewHowWell')}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(RATING_LABELS).map(([rating, labelKey]) => (
                      <button
                        key={rating}
                        type="button"
                        disabled={isRating}
                        onClick={() => rate(rating)}
                        className={`px-4 py-2 border text-sm disabled:opacity-50 ${
                          rating === 'again'
                            ? 'border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/40'
                            : 'border-gray-800 bg-black/40 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        {t(labelKey)} · {BOX_INTERVALS[{'again': 0, 'hard': 1, 'good': 2, 'easy': 3}[rating]]}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {upcomingCards.length > 0 && (
          <div className="mt-8">
            <h2 className="text-white font-semibold mb-3">{t('science.reviewUpcoming')}</h2>
            <div className="border border-gray-800 bg-black/30 divide-y divide-gray-800/60">
              {upcomingCards.slice(0, 8).map((upcoming) => (
                <div key={upcoming.questionId} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm text-gray-400 line-clamp-1">{upcoming.prompt}</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {new Date(upcoming.dueAt).toLocaleDateString()} · {t('science.reviewBox', { days: BOX_INTERVALS[upcoming.box] })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScienceReviewPage;
