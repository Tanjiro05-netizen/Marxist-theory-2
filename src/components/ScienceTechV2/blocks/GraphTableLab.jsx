import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon, Save, Table2 } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';
import { linearFit, numericAnswerMatches, quadraticFit, roundTo } from '../../../utils/scienceLabMath';

// Collect → table → plot → interpret mini-lab. The learner fills an editable
// data table; the plot and fit update live. Numeric interpretation prompts are
// checked locally against authored canonical values with tolerance.
const GraphTableLab = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const columns = content.columns || [];
  const series = content.series || [];
  const prompts = content.prompts || [];
  const initialRows = content.rows || [];
  const fitMode = content.fit || null; // 'linear' | 'quadratic' | null
  const { evidence, isSaving, save, savedAt } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const [rows, setRows] = useState(
    evidence.rows || initialRows.map((row) => row.map((cell) => (cell == null ? '' : cell)))
  );
  const [promptAnswers, setPromptAnswers] = useState(evidence.promptAnswers || {});
  const [checked, setChecked] = useState(false);

  const plottedPoints = useMemo(() => {
    if (series.length === 0) return [];
    const first = series[0];
    return rows
      .map((row) => {
        const colIndex = (key) => columns.findIndex((column) => column.key === key);
        const x = Number(row[colIndex(first.xKey)]);
        const y = Number(row[colIndex(first.yKey)]);
        return { x, y };
      })
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .sort((a, b) => a.x - b.x);
  }, [rows, columns, series]);

  const fit = useMemo(() => {
    if (!fitMode || plottedPoints.length < (fitMode === 'quadratic' ? 3 : 2)) return null;
    return fitMode === 'quadratic' ? quadraticFit(plottedPoints) : linearFit(plottedPoints);
  }, [fitMode, plottedPoints]);

  const updateCell = (rowIndex, colIndex, value) => {
    setRows((current) => current.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row)));
  };

  const updatePromptAnswer = (id, value) => {
    setPromptAnswers((current) => ({ ...current, [id]: value }));
  };

  const persist = ({ complete = false } = {}) => {
    save({ rows, promptAnswers }, { complete, silent: true });
  };

  const runChecks = () => {
    setChecked(true);
    const allAnswered = prompts.every((prompt) => `${promptAnswers[prompt.id] || ''}`.trim() !== '');
    persist({ complete: allAnswered });
  };

  const chartData = plottedPoints.map((point) => ({ x: point.x, y: point.y }));
  const fitLine =
    fit && fitMode === 'linear'
      ? plottedPoints.map((point) => ({ x: point.x, y: fit.slope * point.x + fit.intercept }))
      : null;
  const fitLineQuadratic =
    fit && fitMode === 'quadratic'
      ? plottedPoints.map((point) => ({ x: point.x, y: fit.a * point.x ** 2 + fit.b * point.x + fit.c }))
      : null;
  const overlay = fitLine || fitLineQuadratic || [];

  return (
    <section className="border border-gray-800 bg-black/35 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Table2 className="w-4 h-4 text-blue-400" />
        <p className="text-white font-medium">{block.title || t('science.graphTableLab')}</p>
      </div>

      {content.instructions && (
        <div className="border-b border-gray-800 bg-black/25 p-4 text-sm text-gray-300">{renderScienceMarkdown(content.instructions)}</div>
      )}

      <div className="p-4 grid md:grid-cols-2 gap-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">{t('science.graphTableData')}</p>
          <div className="overflow-x-auto border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-black/60">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="border border-gray-800 px-2 py-1.5 text-gray-400">
                      {column.label}
                      {column.unit ? <span className="text-gray-600"> ({column.unit})</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="bg-black/25">
                    {row.map((cell, colIndex) => (
                      <td key={`cell-${rowIndex}-${colIndex}`} className="border border-gray-800 p-0">
                        <input
                          type="number"
                          value={cell}
                          onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                          className="w-full bg-transparent px-2 py-1.5 text-gray-200 font-mono outline-none focus:bg-black/60"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fit && fitMode === 'linear' && (
            <p className="mt-2 text-sm text-gray-300">
              <span className="text-gray-500">y = </span>
              {roundTo(fit.slope, 4)}·x + {roundTo(fit.intercept, 4)}
              <span className="text-gray-600"> (R² = {roundTo(fit.r2, 4)})</span>
            </p>
          )}
          {fit && fitMode === 'quadratic' && (
            <p className="mt-2 text-sm text-gray-300">
              <span className="text-gray-500">y = </span>
              {roundTo(fit.a, 5)}·x² + {roundTo(fit.b, 4)}·x + {roundTo(fit.c, 3)}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">
            <LineChartIcon className="inline w-3.5 h-3.5 mr-1 text-red-400" />
            {series.length > 0 ? `${columns.find((c) => c.key === series[0].yKey)?.label || 'y'} vs ${columns.find((c) => c.key === series[0].xKey)?.label || 'x'}` : t('science.graphTablePlot')}
          </p>
          {chartData.length < 2 ? (
            <div className="border border-dashed border-gray-800 p-6 text-sm text-gray-600">{t('science.graphTableNeedData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#1f2937" />
                <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0b0d12', border: '1px solid #374151' }} />
                <Line type="monotone" dataKey="y" stroke="#ef4444" dot={{ r: 3 }} strokeWidth={2} isAnimationActive={false} />
                {overlay.length >= 2 && <Line dataKey="y" data={overlay} stroke="#3b82f6" dot={false} strokeDasharray="4 4" strokeWidth={1.5} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {prompts.length > 0 && (
        <div className="border-t border-gray-800 bg-black/30 p-4 space-y-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">{t('science.motionLabQuestions')}</p>
          {prompts.map((prompt) => {
            const value = promptAnswers[prompt.id] || '';
            const isNumeric = prompt.type === 'numeric';
            const isCorrect = checked && isNumeric && numericAnswerMatches(value, prompt.answer, prompt.tolerance);
            const isWrong = checked && isNumeric && !isCorrect && value !== '';
            return (
              <div key={prompt.id}>
                <label className="block text-sm text-gray-300 mb-1.5">{prompt.prompt}</label>
                <div className="flex items-center gap-2">
                  <input
                    type={isNumeric ? 'number' : 'text'}
                    value={value}
                    onChange={(event) => updatePromptAnswer(prompt.id, event.target.value)}
                    className="flex-1 border border-gray-800 bg-black/45 px-3 py-2 text-sm text-white outline-none focus:border-red-700"
                    placeholder={prompt.unit ? `${t('science.enterAnswer')} (${prompt.unit})` : t('science.enterAnswer')}
                  />
                  {checked && isNumeric && (
                    <span className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {isCorrect ? '✓' : `✗ (${prompt.answer} ${prompt.unit || ''})`}
                    </span>
                  )}
                </div>
                {checked && prompt.explanation && <p className="mt-1 text-xs text-gray-500">{prompt.explanation}</p>}
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runChecks}
              className="inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
            >
              <Save className="w-4 h-4" />
              {t('science.motionSaveRecord')}
            </button>
            {isSaving && <span className="text-xs text-gray-500">{t('science.studioSaving')}</span>}
            {!isSaving && savedAt && <span className="text-xs text-gray-600">{t('science.motionSaved')}</span>}
          </div>
        </div>
      )}
    </section>
  );
};

export default GraphTableLab;
