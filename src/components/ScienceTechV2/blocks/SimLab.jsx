import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FlaskConical, Gauge, Play, Scale } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';
import { roundTo } from '../../../utils/scienceLabMath';

// Parameter-play computational lab. The physics model is pre-authored (the
// learner never writes code): they set parameters, predict, run, and validate.
// Model kinds are a fixed registry so no authored string is ever evaluated.

const interpolateAcceleration = (dataset, t) => {
  const rows = dataset || [];
  if (rows.length === 0) return null;
  if (t <= rows[0][0]) return rows[0][1];
  if (t >= rows[rows.length - 1][0]) return rows[rows.length - 1][1];
  for (let i = 1; i < rows.length; i += 1) {
    if (t <= rows[i][0]) {
      const [t0, a0] = rows[i - 1];
      const [t1, a1] = rows[i];
      const span = t1 - t0;
      return span === 0 ? a0 : a0 + ((a1 - a0) * (t - t0)) / span;
    }
  }
  return rows[rows.length - 1][1];
};

const runKinematicsEuler = ({ params, dataset }) => {
  const x0 = Number(params.x0 ?? 0);
  const v0 = Number(params.v0 ?? 0);
  const aConst = Number(params.a ?? 0);
  const dt = Math.max(1e-5, Number(params.dt ?? 0.1));
  const tMax = Math.max(dt, Number(params.tMax ?? 5));
  // The analytic overlay only exists for constant acceleration, never for a
  // measured dataset.
  const analytic = !dataset && (params.analyticOverlay ?? true);

  const points = [];
  let x = x0;
  let v = v0;
  for (let t = 0; t <= tMax + dt / 2; t += dt) {
    const a = dataset ? interpolateAcceleration(dataset, t) : aConst;
    points.push({
      t: roundTo(t, 5),
      x: roundTo(x, 6),
      v: roundTo(v, 6),
      a: roundTo(a, 6),
      xAnalytic: analytic ? roundTo(x0 + v0 * t + 0.5 * aConst * t * t, 6) : null,
    });
    // Explicit Euler update, exactly as taught in the course's mini-lab.
    x = x + v * dt;
    v = v + a * dt;
  }
  return points;
};

const MODEL_RUNNERS = {
  kinematics_euler: runKinematicsEuler,
};

const SimLab = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const config = block?.config_json || {};
  const model = content.model || { kind: 'kinematics_euler' };
  const runner = MODEL_RUNNERS[model.kind];
  const sliders = content.sliders || [];
  const predictions = content.predictions || [];
  const checks = content.checks || [];
  const dataset = model.dataset || null;
  const { evidence, isSaving, save } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const initialParams = useMemo(() => {
    const params = { ...(model.defaults || {}) };
    sliders.forEach((slider) => {
      params[slider.id] = Number(evidence.params?.[slider.id] ?? slider.value ?? slider.min ?? 0);
    });
    return params;
  }, [model, sliders, evidence.params]);

  const [params, setParams] = useState(initialParams);
  const [predictionAnswers, setPredictionAnswers] = useState(evidence.predictions || {});
  const [checkState, setCheckState] = useState(evidence.checks || {});
  const [runSeries, setRunSeries] = useState(null);
  const [halfDtSeries, setHalfDtSeries] = useState(null);
  const [hasRun, setHasRun] = useState(Boolean(evidence.hasRun));

  const predictionsComplete = predictions.every((item) => `${predictionAnswers[item.id] || ''}`.trim().length > 0);
  const canRun = predictions.length === 0 || predictionsComplete || hasRun;

  const executeRun = (overrideParams) => {
    if (!runner) return null;
    return runner({ params: overrideParams || params, dataset });
  };

  const run = () => {
    if (!canRun) return;
    const series = executeRun();
    setRunSeries(series);
    setHalfDtSeries(null);
    setHasRun(true);
    save({ params, predictions: predictionAnswers, hasRun: true, runAt: new Date().toISOString() }, { silent: true });
  };

  const compareHalfDt = () => {
    const base = runSeries || executeRun();
    if (!base) return;
    setRunSeries(base);
    setHalfDtSeries(executeRun({ ...params, dt: Number(params.dt) / 2 }));
    save({ params, halfDtCompared: true }, { silent: true });
  };

  const updateParam = (id, value) => {
    setParams((current) => ({ ...current, [id]: Number(value) }));
  };

  const updatePrediction = (id, value) => {
    setPredictionAnswers((current) => ({ ...current, [id]: value }));
  };

  const toggleCheck = (id) => {
    setCheckState((current) => {
      const next = { ...current, [id]: !current[id] };
      const allChecked = checks.every((item) => next[item.id]);
      save({ checks: next, params }, { complete: allChecked && hasRun, silent: true });
      return next;
    });
  };

  const maxDrift = useMemo(() => {
    if (!runSeries || !halfDtSeries) return null;
    let max = 0;
    halfDtSeries.forEach((fine) => {
      const coarse = runSeries.find((point) => Math.abs(point.t - fine.t) < (Number(params.dt) || 0.1) / 2);
      if (coarse) max = Math.max(max, Math.abs(coarse.x - fine.x));
    });
    return roundTo(max, 6);
  }, [runSeries, halfDtSeries, params.dt]);

  const analyticDrift = useMemo(() => {
    if (!runSeries || runSeries[0]?.xAnalytic == null || dataset) return null;
    let max = 0;
    runSeries.forEach((point) => {
      max = Math.max(max, Math.abs(point.x - point.xAnalytic));
    });
    return roundTo(max, 6);
  }, [runSeries, dataset]);

  if (!runner) {
    return (
      <section className="border border-gray-800 bg-black/30 p-5 text-gray-500">
        {t('science.simLabUnknownModel', { kind: model.kind || '?' })}
      </section>
    );
  }

  const chartData = runSeries || [];

  return (
    <section className="border border-gray-800 bg-black/35 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-blue-400" />
        <p className="text-white font-medium">{block.title || t('science.simLab')}</p>
      </div>

      {content.intro && <div className="border-b border-gray-800 bg-black/25 p-4 text-sm text-gray-300">{renderScienceMarkdown(content.intro)}</div>}

      {predictions.length > 0 && (
        <div className="border-b border-gray-800 bg-black/25 p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-600">{t('science.simLabPredictFirst')}</p>
          {predictions.map((item) => (
            <div key={item.id}>
              <label className="block text-sm text-gray-300 mb-1">{item.prompt}</label>
              <textarea
                value={predictionAnswers[item.id] || ''}
                onChange={(event) => updatePrediction(item.id, event.target.value)}
                disabled={hasRun}
                rows={2}
                placeholder={item.placeholder || t('science.simLabPredictionPlaceholder')}
                className="w-full border border-gray-800 bg-black/45 p-2 text-sm text-white outline-none focus:border-red-700 disabled:opacity-70"
              />
            </div>
          ))}
          {!hasRun && !predictionsComplete && <p className="text-xs text-yellow-500">{t('science.simLabPredictionRequired')}</p>}
        </div>
      )}

      <div className="p-4 grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">{t('science.simLabParameters')}</p>
          {sliders.map((slider) => (
            <label key={slider.id} className="block">
              <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
                <span>
                  {slider.label} {slider.unit ? <span className="text-gray-600">({slider.unit})</span> : null}
                </span>
                <span className="font-mono text-gray-400">{params[slider.id]}</span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step || 0.1}
                value={params[slider.id]}
                disabled={hasRun && !content.allowRerun}
                onChange={(event) => updateParam(slider.id, event.target.value)}
                className="w-full accent-red-600"
              />
            </label>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={!canRun || (hasRun && !content.allowRerun)}
              className="inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
            >
              <Play className="w-4 h-4" />
              {hasRun && content.allowRerun ? t('science.simLabRerun') : t('science.simLabRun')}
            </button>
            {hasRun && !dataset && (
              <button
                type="button"
                onClick={compareHalfDt}
                className="inline-flex items-center gap-2 border border-gray-800 bg-black/40 px-4 py-2 text-sm text-gray-300 hover:border-gray-600"
              >
                <Scale className="w-4 h-4" />
                {t('science.simLabHalfDt')}
              </button>
            )}
            {isSaving && <span className="text-xs text-gray-500">{t('science.studioSaving')}</span>}
          </div>

          {analyticDrift !== null && (
            <div className="border border-gray-800 bg-black/25 p-3 text-sm text-gray-300">
              <span className="text-gray-500">{t('science.simLabAnalyticDrift')} </span>
              <span className="font-mono">{analyticDrift}</span>
            </div>
          )}
          {maxDrift !== null && (
            <div className="border border-gray-800 bg-black/25 p-3 text-sm text-gray-300">
              <span className="text-gray-500">{t('science.simLabHalfDtDrift')} </span>
              <span className="font-mono">{maxDrift}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-wide text-gray-600">{t('science.simLabResults')}</p>
          {!hasRun || chartData.length === 0 ? (
            <div className="border border-dashed border-gray-800 p-6 text-sm text-gray-600">{t('science.simLabNotRunYet')}</div>
          ) : (
            <>
              <div className="border border-gray-800 bg-black/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">x(t)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#1f2937" />
                    <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0b0d12', border: '1px solid #374151' }} />
                    {chartData[0]?.xAnalytic != null && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    <Line type="monotone" dataKey="x" name="Euler" stroke="#ef4444" dot={false} strokeWidth={2} isAnimationActive={false} />
                    {chartData[0]?.xAnalytic != null && (
                      <Line type="monotone" dataKey="xAnalytic" name={t('science.simLabAnalytic')} stroke="#3b82f6" dot={false} strokeDasharray="4 4" strokeWidth={1.5} isAnimationActive={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="border border-gray-800 bg-black/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">v(t)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#1f2937" />
                    <XAxis dataKey="t" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0b0d12', border: '1px solid #374151' }} />
                    <Line type="monotone" dataKey="v" stroke="#22c55e" dot={false} strokeWidth={2} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Gauge className="w-3.5 h-3.5" />
                {t('science.simLabFinal')} x = {roundTo(chartData[chartData.length - 1].x, 4)} · v = {roundTo(chartData[chartData.length - 1].v, 4)}
              </div>
            </>
          )}
        </div>
      </div>

      {checks.length > 0 && (
        <div className="border-t border-gray-800 bg-black/30 p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-600">{t('science.simLabValidation')}</p>
          <div className="space-y-2">
            {checks.map((item) => (
              <label key={item.id} className="flex items-start gap-3 border border-gray-800 bg-black/25 p-3 text-sm text-gray-300">
                <input type="checkbox" checked={Boolean(checkState[item.id])} onChange={() => toggleCheck(item.id)} className="mt-1" />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SimLab;
