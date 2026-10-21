import React, { useEffect, useState } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import { INDICATORS, fetchMultipleIndicators, formatValue } from '../../services/worldBankApi';
import { countries } from '../../data/countries';
import { useTranslation } from 'react-i18next';
import { loadingSpinner } from '../../styles/obsidianTheme.css.ts';
import * as s from './MovementsVisualization.css.ts';

const PANEL_INDICATORS = ['GINI_INDEX', 'UNEMPLOYMENT', 'GDP_PER_CAPITA', 'POVERTY_RATIO'];
const FETCH_YEARS = 8; // enough to always have a recent value despite sparse series

/* On-demand World Bank profile for a country clicked on a map. */
const CountryDataPanel = ({ countryCode, onClose }) => {
    const { t } = useTranslation();
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const countryName = countries.find(c => c.id === countryCode)?.name || countryCode;

    useEffect(() => {
        if (!countryCode) return undefined;
        let cancelled = false;
        const endYear = new Date().getFullYear();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchMultipleIndicators(
                    countryCode,
                    PANEL_INDICATORS.map(key => INDICATORS[key].id),
                    endYear - FETCH_YEARS,
                    endYear
                );
                if (cancelled) return;
                setSeries(data);
            } catch (e) {
                if (!cancelled) setError(e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [countryCode, reloadKey]);

    if (!countryCode) return null;

    const rows = series
        ? PANEL_INDICATORS
            .map(key => {
                const indicator = INDICATORS[key];
                const rowsForIndicator = series[indicator.id] || [];
                const latest = rowsForIndicator[rowsForIndicator.length - 1];
                return latest
                    ? { key, label: t(`data.indicator_${key}`), value: formatValue(latest.value, indicator.format), year: latest.year }
                    : null;
            })
            .filter(Boolean)
        : [];

    return (
        <div className={s.statsPanel}>
            <div className={s.statsHeader}>
                <h4 className={s.statsTitle}>{countryName}</h4>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setReloadKey(k => k + 1)} className={s.statsClose} title={t('data.refresh')} disabled={loading}>
                        <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={onClose} className={s.statsClose} title={t('common.close')}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <div className={loadingSpinner} />
                </div>
            ) : error ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                    <p className={s.messageText} style={{ fontSize: 13 }}>{t('data.loadError')}</p>
                    <button onClick={() => setReloadKey(k => k + 1)} className={s.playBtn} style={{ width: 32, height: 32 }} title={t('data.retry')}>
                        <RefreshCcw size={14} />
                    </button>
                </div>
            ) : rows.length === 0 ? (
                <p className={s.messageText} style={{ fontSize: 13 }}>{t('data.noCountryData')}</p>
            ) : (
                rows.map(row => (
                    <div key={row.key} className={s.statRow}>
                        <span className={s.statName}>{row.label}</span>
                        <span style={{ textAlign: 'right' }}>
                            <span className={s.statVal}>{row.value}</span>
                            <span className={s.statMeta}> · {row.year}</span>
                        </span>
                    </div>
                ))
            )}
        </div>
    );
};

export default CountryDataPanel;
