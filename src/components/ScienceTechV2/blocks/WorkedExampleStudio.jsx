import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Check, ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';

// Cover-the-solution worked example: the learner commits a written attempt
// before the model solution is revealed. Attempt length gates the reveal.
const WorkedExampleStudio = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const config = block?.config_json || {};
  const minChars = Number(config.min_attempt_chars || content.minAttemptChars || 40);
  const { evidence, isSaving, save } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const [attempt, setAttempt] = useState(evidence.attempt || '');
  const [revealed, setRevealed] = useState(Boolean(evidence.revealed));
  const [error, setError] = useState('');

  const attemptLength = attempt.trim().length;
  const canReveal = attemptLength >= minChars || revealed;
  const steps = content.steps || [];

  const reveal = () => {
    if (!canReveal) {
      setError(t('science.studioMinChars', { count: minChars }));
      return;
    }
    setError('');
    setRevealed(true);
    save({ attempt, revealed: true, revealedAt: new Date().toISOString() }, { complete: true, silent: true });
  };

  const persistAttempt = () => {
    if (attempt.trim().length > 0 && attempt !== evidence.attempt) {
      save({ attempt }, { silent: true });
    }
  };

  return (
    <section className="border border-gray-800 bg-black/30 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide mb-2">
        <BookOpen className="w-4 h-4" />
        {t('science.workedExampleStudio')}
      </div>
      <p className="text-white font-medium mb-1">{content.problem || block.title}</p>
      {content.prompt && <p className="text-gray-400 text-sm mb-4">{content.prompt}</p>}

      {!revealed ? (
        <div className="mt-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <PenLine className="w-4 h-4 text-red-400" />
            {t('science.studioAttemptFirst')}
          </label>
          <textarea
            value={attempt}
            onChange={(event) => setAttempt(event.target.value)}
            onBlur={persistAttempt}
            rows={5}
            placeholder={t('science.studioAttemptPlaceholder')}
            className="w-full border border-gray-800 bg-black/45 p-3 text-sm text-white outline-none focus:border-red-700"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`text-xs ${attemptLength >= minChars ? 'text-green-400' : 'text-gray-500'}`}>
              {attemptLength} / {minChars} {t('science.studioChars')}
            </span>
            {isSaving && <span className="text-xs text-gray-500">{t('science.studioSaving')}</span>}
          </div>
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          <button
            type="button"
            onClick={reveal}
            disabled={!canReveal}
            className="mt-3 inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
          >
            <ChevronDown className="w-4 h-4" />
            {t('science.studioRevealSolution')}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {attempt.trim() && (
            <details className="border border-gray-800 bg-black/25 p-3">
              <summary className="cursor-pointer text-sm text-gray-400">{t('science.studioYourAttempt')}</summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{attempt}</p>
            </details>
          )}
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            {t('science.studioModelSolution')}
          </div>
          {steps.map((step, index) => (
            <div key={`step-${index}`} className="flex gap-3 text-gray-300">
              <span className="text-gray-600 font-mono text-sm">{index + 1}</span>
              <div className="flex-1">{renderScienceMarkdown(step)}</div>
            </div>
          ))}
          {content.answer && (
            <div className="border-t border-gray-800 pt-3 text-white">
              <span className="text-gray-400 font-medium">{t('science.answer')} </span>
              {renderScienceMarkdown(content.answer)}
            </div>
          )}
          {content.interpretation && (
            <div className="border border-gray-800 bg-black/40 p-3 text-sm text-gray-300">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">{t('science.studioInterpretation')}</p>
              {renderScienceMarkdown(content.interpretation)}
            </div>
          )}
          <button
            type="button"
            onClick={() => setRevealed(false)}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <ChevronUp className="w-4 h-4" />
            {t('science.studioHideSolution')}
          </button>
        </div>
      )}
    </section>
  );
};

export default WorkedExampleStudio;
