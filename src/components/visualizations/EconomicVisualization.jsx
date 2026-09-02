import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea, ResponsiveContainer } from 'recharts';
import { LineChart as LineIcon, BarChart3, PieChart as PieIcon, RefreshCcw, ChevronDown, ChevronUp, ZoomOut } from 'lucide-react';
import { INDICATORS, COMPARISON_COUNTRIES, DEFAULT_COMPARISON, fetchCountryComparison, calculateStats, formatValue, getYearRange } from '../../services/worldBankApi';
import { useTranslation } from 'react-i18next';
import * as s from './EconomicVisualization.css.ts';
import { loadingSpinner } from '../../styles/obsidianTheme.css.ts';

const METRIC_MAP = {
    gdp: 'GDP_GROWTH',
    inflation: 'INFLATION',
    unemployment: 'UNEMPLOYMENT',
    wages: 'GDP_PER_CAPITA',
    inequality: 'GINI_INDEX',
};

const RANGE_MAP = {
    '1y': '5y',
    '5y': '10y',
    '10y': '20y',
    all: 'max',
};

const CRISIS_PERIODS = [
    { key: 'data.crisis2008', start: 2007, end: 2009 },
    { key: 'data.crisisCovid', start: 2020, end: 2022 },
];

const countryColor = (code) => COMPARISON_COUNTRIES.find(c => c.code === code)?.color || '#c9c5b8';
const countryName = (code) => COMPARISON_COUNTRIES.find(c => c.code === code)?.name || code;

const EconomicVisualization = ({ onDataChange }) => {
    const { t } = useTranslation();
    const [chartType, setChartType] = useState('line');
    const [metric, setMetric] = useState('gdp');
    const [timeRange, setTimeRange] = useState('10y');
    const [selectedCountries, setSelectedCountries] = useState(DEFAULT_COMPARISON);
    const [showCountries, setShowCountries] = useState(false);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [zoomedDomain, setZoomedDomain] = useState(null);
    const [startZoom, setStartZoom] = useState(null);

    const indicator = INDICATORS[METRIC_MAP[metric]];
    const { start: startYear, end: endYear } = useMemo(() => getYearRange(RANGE_MAP[timeRange]), [timeRange]);

    const load = useCallback(async () => {
        if (selectedCountries.length === 0) {
            setData([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const results = await fetchCountryComparison(selectedCountries, indicator.id, startYear, endYear);
            // Reshape { code: [{year, value}] } into wide rows { year, [code]: value }
            const years = new Set();
            Object.values(results).forEach(rows => rows.forEach(r => years.add(r.year)));
            const rows = [...years].sort((a, b) => a - b).map(year => {
                const row = { year };
                selectedCountries.forEach(code => {
                    const match = results[code]?.find(r => r.year === year);
                    if (match) row[code] = match.value;
                });
                return row;
            });
            setData(rows);
        } catch (err) {
            console.error('Error loading World Bank data:', err);
            setError(err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCountries, indicator, startYear, endYear]);

    useEffect(() => { load(); }, [load]);

    // Reset zoom when the query changes
    useEffect(() => { setZoomedDomain(null); setStartZoom(null); }, [metric, timeRange, selectedCountries]);

    // Publish live rows for the page's CSV export
    useEffect(() => { onDataChange?.(data); }, [data, onDataChange]);

    const toggleCountry = (code) => {
        setSelectedCountries(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleMouseDown = (e) => {
        if (e) setStartZoom(e.activeLabel);
    };
    const handleMouseMove = (e) => {
        if (e && startZoom !== null && startZoom !== undefined) setZoomedDomain([startZoom, e.activeLabel]);
    };
    const handleMouseUp = (e) => {
        if (startZoom === null || startZoom === undefined) return;
        const end = e?.activeLabel;
        setStartZoom(null);
        if (end !== undefined && end !== startZoom) {
            setZoomedDomain([Math.min(startZoom, end), Math.max(startZoom, end)]);
        } else {
            setZoomedDomain(null);
        }
    };

    // Stats for the primary country (first selected with data)
    const primary = useMemo(() => {
        for (const code of selectedCountries) {
            const series = data.map(row => ({ year: row.year, value: row[code] })).filter(r => r.value !== undefined);
            if (series.length > 0) return { code, stats: calculateStats(series) };
        }
        return null;
    }, [data, selectedCountries]);

    const fmt = (value, compact = false) => formatValue(value, indicator.format, compact);

    const inViewCrises = CRISIS_PERIODS.filter(p => p.end >= startYear && p.start <= endYear);

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) return null;
        return (
            <div className={s.tooltipCard}>
                <p className={s.tooltipYear}>{label}</p>
                {payload.map(entry => (
                    <div key={entry.dataKey} className={s.tooltipRow}>
                        <span className={s.chipDot} style={{ background: entry.color }} />
                        <span>{countryName(entry.dataKey)}</span>
                        <span className={s.tooltipValue}>{fmt(entry.value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderChart = () => {
        const shared = {
            data,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            margin: { top: 16, right: 16, left: 4, bottom: 24 },
        };
        const axes = (
            <>
                <CartesianGrid strokeDasharray="3 3" stroke="#262a35" vertical={false} />
                <XAxis
                    dataKey="year"
                    stroke="#6f6c61"
                    tick={{ fill: '#a5a194', fontSize: 11 }}
                    domain={zoomedDomain || ['auto', 'auto']}
                    allowDataOverflow={!!zoomedDomain}
                    tickFormatter={y => y}
                />
                <YAxis
                    stroke="#6f6c61"
                    tick={{ fill: '#a5a194', fontSize: 11 }}
                    width={64}
                    tickFormatter={v => formatValue(v, indicator.format, true)}
                />
                <Tooltip content={<CustomTooltip />} />
            </>
        );

        if (chartType === 'pie') {
            // Latest-year snapshot per country
            const latestRow = [...data].reverse().find(row => selectedCountries.some(c => row[c] !== undefined));
            const pieData = latestRow
                ? selectedCountries.filter(c => latestRow[c] !== undefined).map(c => ({ name: countryName(c), value: latestRow[c], color: countryColor(c) }))
                : [];
            return (
                <PieChart margin={{ top: 16, right: 16, left: 16, bottom: 24 }}>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={v => <span style={{ color: '#a5a194', fontSize: 12 }}>{v}</span>} />
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2} stroke="#10131b">
                        {pieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                </PieChart>
            );
        }

        if (chartType === 'bar') {
            return (
                <BarChart {...shared}>
                    {axes}
                    <Legend formatter={v => <span style={{ color: '#a5a194', fontSize: 12 }}>{countryName(v)}</span>} />
                    {inViewCrises.map(p => (
                        <ReferenceArea key={p.key} x1={p.start} x2={p.end} fill="rgba(179, 18, 46, 0.08)" stroke="rgba(179, 18, 46, 0.45)" strokeDasharray="3 3" ifOverflow="extendDomain" />
                    ))}
                    {selectedCountries.map(code => (
                        <Bar key={code} dataKey={code} name={countryName(code)} fill={countryColor(code)} />
                    ))}
                </BarChart>
            );
        }

        return (
            <LineChart {...shared}>
                {axes}
                <Legend formatter={v => <span style={{ color: '#a5a194', fontSize: 12 }}>{countryName(v)}</span>} />
                {inViewCrises.map(p => (
                    <ReferenceArea key={p.key} x1={p.start} x2={p.end} fill="rgba(179, 18, 46, 0.08)" stroke="rgba(179, 18, 46, 0.45)" strokeDasharray="3 3" ifOverflow="extendDomain" />
                ))}
                {selectedCountries.map((code, i) => (
                    <Line
                        key={code}
                        type="monotone"
                        dataKey={code}
                        name={countryName(code)}
                        stroke={countryColor(code)}
                        strokeWidth={i === 0 ? 2.5 : 1.75}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        connectNulls
                    />
                ))}
                {startZoom !== null && zoomedDomain && (
                    <ReferenceArea x1={zoomedDomain[0]} x2={zoomedDomain[1]} strokeOpacity={0} fill="rgba(179, 18, 46, 0.12)" />
                )}
            </LineChart>
        );
    };

    const metricOptions = [
        { id: 'gdp', name: t('data.metricGdp') },
        { id: 'inflation', name: t('data.metricInflation') },
        { id: 'unemployment', name: t('data.metricUnemployment') },
        { id: 'wages', name: t('data.metricWages') },
        { id: 'inequality', name: t('data.metricInequality') },
    ];

    const rangeOptions = [
        { id: '1y', name: t('data.range5') },
        { id: '5y', name: t('data.range10') },
        { id: '10y', name: t('data.range20') },
        { id: 'all', name: t('data.rangeMax') },
    ];

    return (
        <div className={s.root}>
            {/* Control panel */}
            <div className={s.controls}>
                <div className={s.controlGroup}>
                    <span className={s.controlLabel}>{t('data.chartType')}</span>
                    <button onClick={() => setChartType('line')} className={`${s.typeBtn} ${chartType === 'line' ? s.typeBtnActive : ''}`} title={t('data.lineChart')}>
                        <LineIcon size={16} />
                    </button>
                    <button onClick={() => setChartType('bar')} className={`${s.typeBtn} ${chartType === 'bar' ? s.typeBtnActive : ''}`} title={t('data.barChart')}>
                        <BarChart3 size={16} />
                    </button>
                    <button onClick={() => setChartType('pie')} className={`${s.typeBtn} ${chartType === 'pie' ? s.typeBtnActive : ''}`} title={t('data.pieChart')}>
                        <PieIcon size={16} />
                    </button>
                </div>

                <div className={s.controlGroup}>
                    <span className={s.controlLabel}>{t('data.metricLabel')}</span>
                    <select value={metric} onChange={e => setMetric(e.target.value)} className={s.select}>
                        {metricOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className={s.controlGroup}>
                    <span className={s.controlLabel}>{t('data.rangeLabel')}</span>
                    <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className={s.select}>
                        {rangeOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>

                <div className={s.controlGroup} style={{ marginLeft: 'auto' }}>
                    <button onClick={load} className={s.typeBtn} title={t('data.refresh')} disabled={loading}>
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Country selector */}
            <div>
                <button onClick={() => setShowCountries(!showCountries)} className={s.countryToggle}>
                    {t('data.countries')} ({selectedCountries.length})
                    {showCountries ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showCountries && (
                    <div className={s.countryPanel}>
                        <div className={s.countryChips}>
                            {COMPARISON_COUNTRIES.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => toggleCountry(c.code)}
                                    className={`${s.countryChip} ${selectedCountries.includes(c.code) ? s.countryChipActive : ''}`}
                                >
                                    <span className={s.chipDot} style={{ background: c.color, opacity: selectedCountries.includes(c.code) ? 1 : 0.35 }} />
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Chart / states */}
            {loading ? (
                <div className={s.messageState}>
                    <div className={loadingSpinner} />
                    <p className={s.messageText}>{t('common.loading')}…</p>
                </div>
            ) : error ? (
                <div className={s.messageState}>
                    <p className={s.messageText}>{t('data.loadError')}</p>
                    <button onClick={load} className={s.retryBtn}>
                        <RefreshCcw size={14} />
                        {t('data.retry')}
                    </button>
                </div>
            ) : data.length === 0 ? (
                <div className={s.messageState}>
                    <p className={s.messageText}>{t('data.noData')}</p>
                </div>
            ) : (
                <>
                    <div className={s.chartArea}>
                        {zoomedDomain && (
                            <button onClick={() => setZoomedDomain(null)} className={s.zoomReset}>
                                <ZoomOut size={12} />
                                {t('data.resetZoom')}
                            </button>
                        )}
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                    {inViewCrises.length > 0 && chartType !== 'pie' && (
                        <div className={s.crisisLegend}>
                            {inViewCrises.map(p => (
                                <span key={p.key} className={s.crisisItem}>
                                    <span className={s.crisisSwatch} />
                                    {t(p.key)} ({p.start}–{p.end})
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Stat cards */}
            {primary && !loading && (
                <div className={s.statGrid}>
                    <div className={s.statCell}>
                        <div className={s.statLabel}>{t('data.currentValue')}</div>
                        <div className={s.statValue}>{fmt(primary.stats.current)}</div>
                        <div className={s.statNote}>{countryName(primary.code)} · {primary.stats.currentYear}</div>
                    </div>
                    <div className={s.statCell}>
                        <div className={s.statLabel}>{t('data.yoyChange')}</div>
                        <div className={`${s.statValue} ${primary.stats.change < 0 ? s.statDeltaDown : primary.stats.change > 0 ? s.statDeltaUp : ''}`}>
                            {primary.stats.change === null ? '—' : `${primary.stats.change > 0 ? '+' : ''}${primary.stats.change.toFixed(2)}%`}
                        </div>
                        <div className={s.statNote}>{primary.stats.previousYear} → {primary.stats.currentYear}</div>
                    </div>
                    <div className={s.statCell}>
                        <div className={s.statLabel}>{t('data.periodAverage')}</div>
                        <div className={s.statValue}>{fmt(primary.stats.average)}</div>
                        <div className={s.statNote}>{startYear}–{endYear} · {primary.stats.dataPoints} {t('data.dataPoints')}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EconomicVisualization;
