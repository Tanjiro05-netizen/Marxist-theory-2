import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ClipboardCheck, Eye } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';

// Formative constructed response: the learner writes an explanation, then
// self-assesses against a model answer and rubric checkboxes. Nothing here is
// machine-scored; completing the rubric marks the block done.
const ConstructedResponse = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const config = block?.config_json || {};
  const minChars = Number(config.min_chars || content.minChars || 20);
  const rubric = content.rubric || [];
  const { evidence, isSaving, save } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const [response, setResponse] = useState(evidence.response || '');
  const [rubricState, setRubricState] = useState(evidence.rubricState || {});
  const [revealed, setRevealed] = useState(Boolean(evidence.revealed));

  const responseLength = response.trim().length;
  const canReveal = responseLength >= minChars;
  const checkedCount = rubric.filter((item) => rubricState[item.id || item.label]).length;
  const rubricComplete = rubric.length > 0 && checkedCount === rubric.length;

  const persistResponse = () => {
    if (response.trim().length > 0 && response !== evidence.response) {
      save({ response }, { silent: true });
    }
  };

  const toggleRubric = (item) => {
    const key = item.id || item.label;
    const next = { ...rubricState, [key]: !rubricState[key] };
    setRubricState(next);
    save({ rubricState: next }, { complete: Object.keys(next).filter((k) => next[k]).length === rubric.length, silent: true });
  };

  const reveal = () => {
    if (!canReveal) return;
    setRevealed(true);
    save({ response, revealed: true }, { silent: true });
  };

  return (
    <section className="border border-gray-800 bg-black/30 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide mb-2">
        <ClipboardCheck className="w-4 h-4" />
        {t('science.constructedResponse')}
      </div>
      {content.prompt && <p className="text-white mb-4">{renderScienceMarkdown(content.prompt)}</p>}
      {content.guidance && <p className="text-gray-400 text-sm mb-4">{content.guidance}</p>}

      <textarea
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        onBlur={persistResponse}
        rows={6}
        placeholder={t('science.constructedPlaceholder')}
        className="w-full border border-gray-800 bg-black/45 p-3 text-sm text-white outline-none focus:border-red-700"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`text-xs ${canReveal ? 'text-green-400' : 'text-gray-500'}`}>
          {responseLength} / {minChars} {t('science.studioChars')}
        </span>
        {isSaving && <span className="text-xs text-gray-500">{t('science.studioSaving')}</span>}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          disabled={!canReveal}
          className="mt-3 inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
        >
          <Eye className="w-4 h-4" />
          {t('science.constructedCompare')}
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          {content.modelAnswer && (
            <div className="border border-gray-800 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">{t('science.constructedModelAnswer')}</p>
              {renderScienceMarkdown(content.modelAnswer)}
            </div>
          )}
          {rubric.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">{t('science.constructedRubric')}</p>
              <div className="space-y-2">
                {rubric.map((item) => {
                  const key = item.id || item.label;
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 border p-3 text-sm ${
                        rubricState[key] ? 'border-green-900 bg-green-950/10 text-gray-300' : 'border-gray-800 bg-black/25 text-gray-300'
                      }`}
                    >
                      <input type="checkbox" checked={Boolean(rubricState[key])} onChange={() => toggleRubric(item)} className="mt-1" />
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className={`mt-2 text-xs ${rubricComplete ? 'text-green-400' : 'text-gray-500'}`}>
                {checkedCount} / {rubric.length} {t('science.constructedRubricChecked')} {rubricComplete ? <Check className="inline w-3 h-3" /> : null}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ConstructedResponse;
