import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, Crosshair, Database, Play, RotateCcw, Save, SkipBack, SkipForward, Table2, TrendingUp } from 'lucide-react';
import { useBlockEvidence } from './useBlockEvidence';
import { renderScienceMarkdown } from './scienceMarkdown';
import { computeVelocities, linearFit, numericAnswerMatches, quadraticFit, roundTo } from '../../../utils/scienceLabMath';

// Frame-step video motion tracking on a curated clip (click-to-track), with a
// bundled dataset fallback. Everything is computed locally; only the derived
// data table, calibration, fit results, and prompt answers are persisted as
// block evidence — never the video itself.
const MotionLab = ({ block, initialEvidence }) => {
  const { t } = useTranslation();
  const content = block?.content_json || {};
  const config = block?.config_json || {};
  const videoUrl = content.videoUrl || config.video_url;
  const assumedFps = Number(config.fps || 30);
  const dataset = content.dataset || null;
  const prompts = content.prompts || [];
  const minPoints = Number(config.min_points || 10);
  const { evidence, isSaving, save, savedAt } = useBlockEvidence({ blockId: block?.id, initialEvidence });

  const videoRef = useRef(null);
  const overlayRef = useRef(null);

  const [points, setPoints] = useState(evidence.points || []); // {t, xPx, yPx}
  const [calPoints, setCalPoints] = useState(evidence.calPoints || []); // two-click calibration [{xPx,yPx}]
  const [knownLength, setKnownLength] = useState(evidence.knownLength ?? '');
  const [pxPerMeter, setPxPerMeter] = useState(evidence.pxPerMeter ?? '');
  const [currentTime, setCurrentTime] = useState(0);
  const [calibrating, setCalibrating] = useState(false);
  const [promptAnswers, setPromptAnswers] = useState(evidence.promptAnswers || {});
  const [checked, setChecked] = useState(false);
  const [tableVisible, setTableVisible] = useState(true);

  const effectiveScale = useMemo(() => {
    const direct = Number(pxPerMeter);
    if (Number.isFinite(direct) && direct > 0) return direct;
    if (calPoints.length === 2 && Number(knownLength) > 0) {
      const dx = calPoints[1].xPx - calPoints[0].xPx;
      const dy = calPoints[1].yPx - calPoints[0].yPx;
      const pixelLength = Math.sqrt(dx * dx + dy * dy);
      if (pixelLength > 0) return pixelLength / Number(knownLength);
    }
    return null;
  }, [calPoints, knownLength, pxPerMeter]);

  // Tracked series in physical units (meters) when calibrated; pixels otherwise.
  const series = useMemo(() => {
    if (dataset) {
      return (dataset.rows || [])
        .filter((row) => Number.isFinite(Number(row?.[0])) && Number.isFinite(Number(row?.[1])))
        .map((row) => ({ x: Number(row[0]), y: Number(row[1]) }));
    }
    const scale = effectiveScale || 1;
    return [...points]
      .sort((a, b) => a.t - b.t)
      .map((point) => ({ x: roundTo(point.t, 4), y: roundTo(point.yPx / scale, 4) }));
  }, [dataset, effectiveScale, points]);

  const velocities = useMemo(() => computeVelocities(series), [series]);
  const fitLinear = useMemo(() => linearFit(series), [series]);
  const fitQuadratic = useMemo(() => quadraticFit(series), [series]);
  const fitSegment = useMemo(() => {
    if (!fitLinear || series.length === 0) return null;
    const first = series[0];
    const last = series[series.length - 1];
    return [
      { x: first.x, y: fitLinear.slope * first.x + fitLinear.intercept },
      { x: last.x, y: fitLinear.slope * last.x + fitLinear.intercept },
    ];
  }, [fitLinear, series]);
  const unitLabel = dataset ? (dataset.xUnit || 's') : 's';

  const stepFrame = (direction) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + direction / assumedFps));
    video.currentTime = next;
    setCurrentTime(next);
  };

  const handleOverlayClick = (event) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;
    const rect = overlay.getBoundingClientRect();
    const xPx = event.clientX - rect.left;
    const yPx = event.clientY - rect.top;

    if (calibrating) {
      setCalPoints((current) => {
        const next = [...current, { xPx, yPx }];
        return next.length > 2 ? [next[next.length - 1]] : next;
      });
      if (calPoints.length === 1) setCalibrating(false);
      return;
    }

    setPoints((current) => [...current, { t: roundTo(video.currentTime, 4), xPx, yPx }]);
  };

  const resetTracking = () => {
    setPoints([]);
    setChecked(false);
  };

  const persist = ({ complete = false } = {}) => {
    save(
      {
        points,
        calPoints,
        knownLength,
        pxPerMeter,
        promptAnswers,
        fit: {
          linear: fitLinear ? { slope: roundTo(fitLinear.slope), intercept: roundTo(fitLinear.intercept), r2: roundTo(fitLinear.r2) } : null,
          quadratic: fitQuadratic ? { a: roundTo(fitQuadratic.a), b: roundTo(fitQuadratic.b), c: roundTo(fitQuadratic.c) } : null,
        },
        pointCount: series.length,
      },
      { complete, silent: true }
    );
  };

  const updatePromptAnswer = (id, value) => {
    setPromptAnswers((current) => ({ ...current, [id]: value }));
  };

  const runChecks = () => {
    setChecked(true);
    persist({ complete: true });
  };

  const enoughPoints = series.length >= minPoints;

  return (
    <section className="border border-gray-800 bg-black/35 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-red-400" />
        <p className="text-white font-medium">{block.title || t('science.motionLab')}</p>
        <span className="ml-auto text-xs text-gray-500">
          {series.length} {t('science.motionPoints')} {series.length > 0 && effectiveScale ? `· ${roundTo(effectiveScale, 1)} px/m` : ''}
        </span>
      </div>

      {content.instructions && (
        <div className="border-b border-gray-800 bg-black/25 p-4 text-sm text-gray-300">{renderScienceMarkdown(content.instructions)}</div>
      )}

      {videoUrl ? (
        <div className="p-4">
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className={`relative w-full bg-black border ${calibrating ? 'border-yellow-600 cursor-crosshair' : 'border-gray-800 cursor-crosshair'}`}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              className="w-full max-h-[420px] object-contain pointer-events-none"
              controls={false}
              preload="metadata"
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {calPoints.map((point, index) => (
                <circle key={`cal-${index}`} cx={point.xPx} cy={point.yPx} r="5" fill="none" stroke="#eab308" strokeWidth="2" />
              ))}
              {calPoints.length === 2 && (
                <line
                  x1={calPoints[0].xPx}
                  y1={calPoints[0].yPx}
                  x2={calPoints[1].xPx}
                  y2={calPoints[1].yPx}
                  stroke="#eab308"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
              {points.map((point, index) => (
                <g key={`pt-${index}`}>
                  <circle cx={point.xPx} cy={point.yPx} r="4" fill="#ef4444" fillOpacity="0.8" />
                  {index > 0 && (
                    <line
                      x1={points[index - 1].xPx}
                      y1={points[index - 1].yPx}
                      x2={point.xPx}
                      y2={point.yPx}
                      stroke="#ef4444"
                      strokeOpacity="0.5"
                      strokeWidth="1"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => stepFrame(-1)} className="border border-gray-800 bg-black/40 p-2 text-gray-300 hover:border-gray-600" title={t('science.motionPrevFrame')}>
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => videoRef.current?.play()}
              className="border border-gray-800 bg-black/40 p-2 text-gray-300 hover:border-gray-600"
              title={t('science.motionPlay')}
            >
              <Play className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => stepFrame(1)} className="border border-gray-800 bg-black/40 p-2 text-gray-300 hover:border-gray-600" title={t('science.motionNextFrame')}>
              <SkipForward className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 font-mono">t = {roundTo(currentTime, 3)} s</span>
            <span className="text-xs text-gray-600">· {t('science.motionClickHint')}</span>
            <button
              type="button"
              onClick={resetTracking}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('science.motionReset')}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3 border border-gray-800 bg-black/25 p-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-400">{t('science.motionCalibration')}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCalPoints([]);
                setCalibrating(true);
              }}
              className={`border px-3 py-1.5 text-xs ${calibrating ? 'border-yellow-600 bg-yellow-950/30 text-yellow-300' : 'border-gray-800 bg-black/40 text-gray-300 hover:border-gray-600'}`}
            >
              {calibrating ? t('science.motionCalibrating') : t('science.motionCalibrateLength')}
            </button>
            <label className="text-xs text-gray-400">
              {t('science.motionKnownLength')}
              <input
                type="number"
                value={knownLength}
                onChange={(event) => setKnownLength(event.target.value)}
                placeholder="1.000"
                step="0.001"
                className="ml-2 w-24 border border-gray-800 bg-black/45 px-2 py-1 text-sm text-white outline-none focus:border-yellow-700"
              />
              m
            </label>
            <label className="text-xs text-gray-400">
              {t('science.motionPxPerMeter')}
              <input
                type="number"
                value={pxPerMeter}
                onChange={(event) => setPxPerMeter(event.target.value)}
                placeholder={effectiveScale ? roundTo(effectiveScale, 2) : '—'}
                step="0.1"
                className="ml-2 w-24 border border-gray-800 bg-black/45 px-2 py-1 text-sm text-white outline-none focus:border-yellow-700"
              />
            </label>
            {calibrating && <span className="text-xs text-yellow-400">{t('science.motionCalibrateHint')}</span>}
          </div>
        </div>
      ) : dataset ? (
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Database className="w-4 h-4 text-blue-400" />
            {t('science.motionDatasetMode')}
          </div>
          <p className="mt-1 text-xs text-gray-600">
            {dataset.description || t('science.motionDatasetDescription')} ({dataset.label || ''})
          </p>
        </div>
      ) : (
        <div className="p-6 text-gray-500">{t('science.motionMissingSource')}</div>
      )}

      {series.length >= 2 && (
        <div className="border-t border-gray-800 p-4 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <TrendingUp className="w-4 h-4 text-red-400" />
            {t('science.motionPositionGraph')}
            {!enoughPoints && <span className="text-xs text-yellow-500">· {t('science.motionNeedMorePoints', { count: minPoints })}</span>}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-800 bg-black/40 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">x(t) — {dataset ? dataset.yUnit || 'm' : 'm'}</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={series}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: unitLabel, position: 'insideBottom', offset: -2, fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0b0d12', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="y" stroke="#ef4444" dot={false} strokeWidth={2} isAnimationActive={false} />
                  {fitSegment && <ReferenceLine segment={fitSegment} stroke="#3b82f6" strokeDasharray="4 4" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-gray-800 bg-black/40 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-2">v(t) — {dataset ? `${dataset.yUnit || 'm'}/s` : 'm/s'}</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={velocities}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="x" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: unitLabel, position: 'insideBottom', offset: -2, fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0b0d12', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="y" stroke="#22c55e" dot={false} strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border border-gray-800 bg-black/25 p-3 text-sm">
            {fitLinear && (
              <span className="text-gray-300">
                <span className="text-gray-500">x = </span>
                {roundTo(fitLinear.slope, 3)}·t + {roundTo(fitLinear.intercept, 3)}
                <span className="text-gray-600"> (R² = {roundTo(fitLinear.r2, 4)})</span>
              </span>
            )}
            {fitQuadratic && (
              <span className="text-gray-300">
                <span className="text-gray-500">x = </span>
                {roundTo(fitQuadratic.a, 4)}·t² + {roundTo(fitQuadratic.b, 3)}·t + {roundTo(fitQuadratic.c, 3)}
                {fitQuadratic.a !== 0 && (
                  <span className="text-gray-600"> → a ≈ {roundTo(2 * fitQuadratic.a, 3)} m/s²</span>
                )}
              </span>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setTableVisible((value) => !value)}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
            >
              <Table2 className="w-4 h-4" />
              {tableVisible ? t('science.motionHideTable') : t('science.motionShowTable')}
            </button>
            {tableVisible && (
              <div className="mt-2 max-h-56 overflow-y-auto border border-gray-800">
                <table className="w-full text-sm">
                  <thead className="bg-black/60 sticky top-0">
                    <tr>
                      <th className="border border-gray-800 px-2 py-1 text-gray-400">t (s)</th>
                      <th className="border border-gray-800 px-2 py-1 text-gray-400">x (m)</th>
                      <th className="border border-gray-800 px-2 py-1 text-gray-400">v (m/s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((point, index) => (
                      <tr key={`row-${point.x}-${index}`} className="bg-black/25">
                        <td className="border border-gray-800 px-2 py-1 text-gray-300 font-mono">{point.x}</td>
                        <td className="border border-gray-800 px-2 py-1 text-gray-300 font-mono">{point.y}</td>
                        <td className="border border-gray-800 px-2 py-1 text-gray-300 font-mono">
                          {velocities[index] ? roundTo(velocities[index].y, 3) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
                {checked && prompt.explanation && (
                  <p className="mt-1 text-xs text-gray-500">{prompt.explanation}</p>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runChecks}
              disabled={!enoughPoints}
              className="inline-flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-40"
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

export default MotionLab;
