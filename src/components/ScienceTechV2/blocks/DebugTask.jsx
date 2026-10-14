import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bug, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';

// "Debug the solution": a flawed worked solution the learner must critique.
// Each prompt requires a written response; submitting reveals the diagnosis
// with the course's error-taxonomy classification (model / representation /
// mathematical / interpretation).
const TAXONOMY_COLORS = {
  model: 'border-purple-900/60 bg-purple-950/20 text-purple-300',
  representation: 'border-blue-900/60 bg-blue-950/20 text-blue-300',
  mathematical: 'border-yellow-900/60 bg-yellow-950/20 text-yellow-300',
  interpretation: 'border-green-900/60 bg-green-950/20 text-green-300',
};

const TaxonomyTag = ({ tag }) => (
  <span className={`border px-2 py-0.5 text-xs uppercase tracking-wide ${TAXONOMY_COLORS[tag] || 'border-gray-800 bg-black/30 text-gray-400'}`}>
    {tag}
  </span>
);

const DebugTask = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const config = block?.config_json || {};
  const prompts = content.prompts || [];
  const defaultMin = Number(config.min_chars || 15);
  const { evidence, isSaving, save } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const [responses, setResponses] = useState(evidence.responses || {});
  const [submitted, setSubmitted] = useState(Boolean(evidence.submitted));

  const responseComplete = prompts.every((prompt, index) => {
    const min = Number(prompt.minChars || defaultMin);
    return `${responses[prompt.id || index] || ''}`.trim().length >= min;
  });

  const updateResponse = (key, value) => {
    setResponses((current) => ({ ...current, [key]: value }));
  };

  const persist = () => {
    save({ responses }, { silent: true });
  };

  const submit = () => {
    setSubmitted(true);
    save({ responses, submitted: true, submittedAt: new Date().toISOString() }, { complete: true, silent: true });
  };

  const flawedSteps = content.flawedSteps || (content.flawedSolution ? [content.flawedSolution] : []);

  return (
    <section className="border border-red-900/40 bg-black/35 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
          <Bug className="w-4 h-4 text-red-400" />
          {t('science.debugTask')}
        </div>
        {content.taxonomy && <TaxonomyTag tag={content.taxonomy} />}
      </div>
      <p className="text-white font-medium mb-1">{content.title || block.title}</p>
      {content.scenario && <p className="text-gray-400 text-sm mb-4">{renderScienceMarkdown(content.scenario)}</p>}

      {flawedSteps.length > 0 && (
        <div className="border border-gray-800 bg-black/40 p-4 mb-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-red-400/80 mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t('science.debugFlawedSolution')}
          </p>
          <div className="space-y-2">
            {flawedSteps.map((step, index) => (
              <div key={`flawed-${index}`} className="flex gap-3 text-gray-300">
                <span className="text-gray-600 font-mono text-sm">{index + 1}</span>
                <div className="flex-1">{renderScienceMarkdown(step)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {prompts.map((prompt, index) => {
          const key = prompt.id || index;
          const min = Number(prompt.minChars || defaultMin);
          const value = responses[key] || '';
          return (
            <div key={`prompt-${key}`}>
              <label className="block text-sm text-gray-300 mb-2">
                <span className="text-gray-500 font-mono mr-2">{index + 1}.</span>
                {prompt.prompt}
              </label>
              <textarea
                value={value}
                onChange={(event) => updateResponse(key, event.target.value)}
                onBlur={persist}
                disabled={submitted}
                rows={3}
                placeholder={t('science.debugPlaceholder')}
                className="w-full border border-gray-800 bg-black/45 p-3 text-sm text-white outline-none focus:border-red-700 disabled:opacity-70"
              />
              {!submitted && (
                <span className={`text-xs ${value.trim().length >= min ? 'text-green-400' : 'text-gray-500'}`}>
                  {value.trim().length} / {min} {t('science.studioChars')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={!responseComplete}
          className="mt-4 inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('science.debugSubmitDiagnosis')}
        </button>
      ) : (
        isSaving && <span className="mt-3 block text-xs text-gray-500">{t('science.studioSaving')}</span>
      )}

      {submitted && content.feedback && (
        <div className="mt-5 border border-green-900/40 bg-green-950/10 p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-green-400/80 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('science.debugDiagnosis')}
          </p>
          {content.errorClass && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('science.debugErrorClass')}:</span>
              <TaxonomyTag tag={content.errorClass} />
            </div>
          )}
          {renderScienceMarkdown(content.feedback)}
        </div>
      )}
    </section>
  );
};

export default DebugTask;
