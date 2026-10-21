import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Plus, Target, Trash2 } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';

// Palette-based free-body-diagram builder. The learner picks a force label and
// sets its direction (0° = +x, 90° = +y); checking compares the learner's set
// against the authored target with an angular tolerance. Practice-level local
// feedback — the pedagogical point is constructing the diagram, not the score.
const ANGLE_TOLERANCE = 12;

const angleDiff = (a, b) => {
  let delta = Math.abs((a - b) % 360);
  if (delta > 180) delta = 360 - delta;
  return delta;
};

const FbdBuilder = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const palette = content.palette || [];
  const target = content.target || [];
  const tolerance = Number(content.angleTolerance || ANGLE_TOLERANCE);
  const { evidence, isSaving, save } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const [forces, setForces] = useState(evidence.forces || []);
  const [selectedLabel, setSelectedLabel] = useState(palette[0]?.label || '');
  const [angle, setAngle] = useState(0);
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const canvasSize = { width: 340, height: 280 };
  const origin = { x: canvasSize.width / 2, y: canvasSize.height / 2 };
  const arrowLength = 105;

  const addForce = () => {
    if (!selectedLabel) return;
    const next = [...forces, { label: selectedLabel, angle: Number(angle) }];
    setForces(next);
    setChecked(false);
    setFeedback(null);
    save({ forces: next }, { silent: true });
  };

  const removeForce = (index) => {
    const next = forces.filter((_, i) => i !== index);
    setForces(next);
    setChecked(false);
    setFeedback(null);
    save({ forces: next }, { silent: true });
  };

  const runCheck = () => {
    const used = new Array(forces.length).fill(false);
    const missing = [];
    const wrongDirection = [];

    target.forEach((targetForce) => {
      let labelMatchIndex = -1;
      let bestDelta = Infinity;
      forces.forEach((force, index) => {
        if (used[index] || force.label !== targetForce.label) return;
        const delta = angleDiff(force.angle, targetForce.angle);
        if (delta < bestDelta) {
          bestDelta = delta;
          labelMatchIndex = index;
        }
      });
      if (labelMatchIndex === -1) {
        missing.push(targetForce.label);
      } else {
        used[labelMatchIndex] = true;
        if (bestDelta > tolerance) {
          wrongDirection.push({ label: targetForce.label, expected: targetForce.angle, got: forces[labelMatchIndex].angle });
        }
      }
    });

    const extra = forces.filter((_, index) => !used[index]).map((force) => force.label);

    const result = {
      correct: missing.length === 0 && wrongDirection.length === 0 && extra.length === 0,
      missing,
      wrongDirection,
      extra,
    };
    setFeedback(result);
    setChecked(true);
    save({ forces, checked: true, result: { correct: result.correct } }, { complete: result.correct, silent: true });
  };

  const arrowEndpoint = (angleDegrees) => {
    const radians = (angleDegrees * Math.PI) / 180;
    return {
      x2: origin.x + arrowLength * Math.cos(radians),
      y2: origin.y - arrowLength * Math.sin(radians),
    };
  };

  return (
    <section className="border border-gray-800 bg-black/35 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Target className="w-4 h-4 text-red-400" />
        <p className="text-white font-medium">{block.title || t('science.fbdBuilder')}</p>
      </div>

      {content.scenario && <div className="border-b border-gray-800 bg-black/25 p-4 text-sm text-gray-300">{renderScienceMarkdown(content.scenario)}</div>}

      <div className="p-4 grid md:grid-cols-2 gap-5">
        <div>
          <svg viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`} className="w-full border border-gray-800 bg-black/50">
            {/* axes */}
            <line x1={origin.x - 130} y1={origin.y} x2={origin.x + 130} y2={origin.y} stroke="#374151" strokeWidth="1" strokeDasharray="2 4" />
            <line x1={origin.x} y1={origin.y - 120} x2={origin.x} y2={origin.y + 120} stroke="#374151" strokeWidth="1" strokeDasharray="2 4" />
            <text x={origin.x + 132} y={origin.y + 3} fill="#4b5563" fontSize="10">x</text>
            <text x={origin.x - 6} y={origin.y - 124} fill="#4b5563" fontSize="10">y</text>
            {/* body */}
            <rect x={origin.x - 28} y={origin.y - 28} width="56" height="56" fill="#1f2937" stroke="#6b7280" strokeWidth="1.5" />
            <text x={origin.x} y={origin.y + 4} textAnchor="middle" fill="#9ca3af" fontSize="10">
              {content.bodyLabel || 'm'}
            </text>
            {/* preview arrow */}
            {selectedLabel && !checked && (
              <line {...{ x1: origin.x, y1: origin.y, ...arrowEndpoint(angle) }} stroke="#6b7280" strokeWidth="2" markerEnd="none" strokeDasharray="5 4" />
            )}
            {/* learner forces */}
            {forces.map((force, index) => {
              const { x2, y2 } = arrowEndpoint(force.angle);
              let stroke = '#ef4444';
              if (checked && feedback) {
                stroke = feedback.correct ? '#22c55e' : '#ef4444';
              }
              return (
                <g key={`force-${index}`}>
                  <line x1={origin.x} y1={origin.y} x2={x2} y2={y2} stroke={stroke} strokeWidth="2.5" />
                  <polygon
                    points={`${x2},${y2} ${x2 - 8 * Math.cos((force.angle - 25) * Math.PI / 180)},${y2 + 8 * Math.sin((force.angle - 25) * Math.PI / 180)} ${x2 - 8 * Math.cos((force.angle + 25) * Math.PI / 180)},${y2 + 8 * Math.sin((force.angle + 25) * Math.PI / 180)}`}
                    fill={stroke}
                  />
                  <text x={x2 + 6 * Math.cos(force.angle * Math.PI / 180)} y={y2 - 6 * Math.sin(force.angle * Math.PI / 180)} fill="#d1d5db" fontSize="11">
                    {force.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-400">
              {t('science.fbdForce')}
              <select
                value={selectedLabel}
                onChange={(event) => setSelectedLabel(event.target.value)}
                className="ml-2 border border-gray-800 bg-black/45 px-2 py-1.5 text-sm text-white outline-none focus:border-red-700"
              >
                {palette.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-400">
              {t('science.fbdAngle')}
              <input
                type="number"
                value={angle}
                onChange={(event) => setAngle(event.target.value)}
                step="5"
                className="ml-2 w-20 border border-gray-800 bg-black/45 px-2 py-1.5 text-sm text-white outline-none focus:border-red-700"
              />
              °
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              className="accent-red-600 w-32"
            />
            <button
              type="button"
              onClick={addForce}
              disabled={!selectedLabel}
              className="inline-flex items-center gap-1.5 border border-gray-800 bg-black/40 px-3 py-1.5 text-sm text-gray-200 hover:border-gray-600 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              {t('science.fbdAdd')}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">{t('science.fbdYourForces')}</p>
          {forces.length === 0 ? (
            <p className="text-sm text-gray-600">{t('science.fbdEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {forces.map((force, index) => (
                <li key={`list-${index}`} className="flex items-center gap-3 border border-gray-800 bg-black/25 px-3 py-2 text-sm text-gray-300">
                  <span className="font-mono text-gray-500">{force.angle}°</span>
                  <span className="flex-1">{force.label}</span>
                  <button type="button" onClick={() => removeForce(index)} className="text-gray-600 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={runCheck}
              disabled={forces.length === 0}
              className="inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              {t('science.fbdCheck')}
            </button>
            {isSaving && <span className="text-xs text-gray-500">{t('science.studioSaving')}</span>}
          </div>

          {checked && feedback && (
            <div className={`mt-4 border p-4 text-sm ${feedback.correct ? 'border-green-900/50 bg-green-950/10 text-green-300' : 'border-gray-800 bg-black/30 text-gray-300'}`}>
              {feedback.correct ? (
                <p>{t('science.fbdCorrect')}</p>
              ) : (
                <div className="space-y-2">
                  {feedback.missing.length > 0 && (
                    <p>
                      <span className="text-red-400">{t('science.fbdMissing')}:</span> {feedback.missing.join(', ')}
                    </p>
                  )}
                  {feedback.wrongDirection.length > 0 && (
                    <p>
                      <span className="text-yellow-400">{t('science.fbdWrongDirection')}:</span>{' '}
                      {feedback.wrongDirection.map((item) => `${item.label} → ${item.expected}° (${t('science.fbdYours')}: ${item.got}°)`).join('; ')}
                    </p>
                  )}
                  {feedback.extra.length > 0 && (
                    <p>
                      <span className="text-blue-400">{t('science.fbdExtra')}:</span> {feedback.extra.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {content.hints && content.hints.length > 0 && (
            <details className="mt-4 border border-gray-800 bg-black/25 p-3">
              <summary className="cursor-pointer text-sm text-gray-400">{t('science.showHint')}</summary>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-400 space-y-1">
                {content.hints.map((hint, index) => (
                  <li key={`hint-${index}`}>{hint}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
};

export default FbdBuilder;
