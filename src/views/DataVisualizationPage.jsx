import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, Users, TrendingUp, Map, BarChart, LineChart, PieChart, Sliders, SplitSquareVertical, Download, FileDown } from 'lucide-react';
import { exportToCSV, exportToPNG } from '../utils/exportData';
import EconomicVisualization from '../components/visualizations/EconomicVisualization';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import * as s from './DataVisualizationPage.css.ts';

/* Alternate tabs and toolbar modes are code-split so recharts/d3 only ship
   with what the default view needs. EconomicVisualization (the default tab)
   stays static. */
const EnhancedChart = dynamic(() => import('../components/visualizations/EnhancedChart'), { ssr: false });
const WhatIfAnalysis = dynamic(() => import('../components/visualizations/WhatIfAnalysis'), { ssr: false });
const SplitView = dynamic(() => import('../components/visualizations/SplitView'), { ssr: false });
const ClassVisualization = dynamic(() => import('../components/visualizations/ClassVisualization'), { ssr: false });
const TrendsVisualization = dynamic(() => import('../components/visualizations/TrendsVisualization'), { ssr: false });
const MovementsVisualization = dynamic(() => import('../components/visualizations/MovementsVisualization'), { ssr: false });

const DataVisualizationPage = () => {
    const { t } = useTranslation();
    const [activeView, setActiveView] = useState('economic');
    const [chartType, setChartType] = useState('bar');
    const [sentiment, setSentiment] = useState('neutral');
    const [hoveredData, setHoveredData] = useState(null);
    const [showTransition, setShowTransition] = useState(false);
    const [showWhatIf, setShowWhatIf] = useState(false);
    const [viewMode, setViewMode] = useState('standard'); // 'standard', 'split'
    const chartRef = useRef(null);
    const liveDataRef = useRef([]);
    const handleLiveDataChange = useCallback((rows) => { liveDataRef.current = rows || []; }, []);

    const handleExportPNG = useCallback(() => {
        if (chartRef.current) {
            const vizName = visualizations.find(v => v.id === activeView)?.name || 'chart';
            exportToPNG(chartRef.current, vizName.replace(/\s+/g, '-').toLowerCase());
        }
    }, [activeView]);

    const handleExportCSV = useCallback(() => {
        const sampleData = {
            economic: [
                { year: 2020, gdp_growth: 2.3, inflation: 1.2, unemployment: 5.4 },
                { year: 2021, gdp_growth: 5.7, inflation: 4.7, unemployment: 5.3 },
                { year: 2022, gdp_growth: 2.1, inflation: 8.0, unemployment: 3.6 },
                { year: 2023, gdp_growth: 2.5, inflation: 4.1, unemployment: 3.7 },
            ],
            class: [
                { class: 'Working Class', percentage: 60, trend: 'declining' },
                { class: 'Middle Class', percentage: 30, trend: 'shrinking' },
                { class: 'Capitalist Class', percentage: 10, trend: 'growing' },
            ],
            trends: [
                { decade: '1980s', inequality_index: 0.35, union_membership: 20.1 },
                { decade: '1990s', inequality_index: 0.40, union_membership: 15.5 },
                { decade: '2000s', inequality_index: 0.45, union_membership: 12.5 },
                { decade: '2010s', inequality_index: 0.49, union_membership: 10.5 },
            ],
            movements: [
                { region: 'Latin America', movements: 12, period: '2000-2024' },
                { region: 'Europe', movements: 8, period: '2000-2024' },
                { region: 'Asia', movements: 15, period: '2000-2024' },
                { region: 'Africa', movements: 10, period: '2000-2024' },
            ],
        };
        const vizName = visualizations.find(v => v.id === activeView)?.name || 'data';
        // Live data published by the active visualization (World Bank series,
        // map events); fall back to sample data for tabs without real data yet.
        const liveRows = liveDataRef.current;
        if (liveRows.length > 0) {
            exportToCSV(liveRows, vizName.replace(/\s+/g, '-').toLowerCase());
            return;
        }
        exportToCSV(sampleData[activeView] || [], vizName.replace(/\s+/g, '-').toLowerCase());
    }, [activeView]);

    // Handle view change with transition animation
    const handleViewChange = (viewId) => {
        if (viewId === activeView) return;
        
        setShowTransition(true);
        
        setTimeout(() => {
            setActiveView(viewId);
            setShowTransition(false);
        }, 300);
    };
    
    // Update sentiment when data type changes
    useEffect(() => {
        // Default sentiments for each view
        const defaultSentiments = {
            economic: 'negative',
            class: 'neutral',
            trends: 'positive',
            movements: 'neutral'
        };
        
        setSentiment(defaultSentiments[activeView] || 'neutral');
    }, [activeView]);

    const visualizations = [
        {
            id: 'economic',
            name: t('data.economic'),
            icon: BarChart3,
            description: t('data.economicDesc')
        },
        {
            id: 'class',
            name: t('data.class'),
            icon: Users,
            description: t('data.classDesc')
        },
        {
            id: 'trends',
            name: t('data.trends'),
            icon: TrendingUp,
            description: t('data.trendsDesc')
        },
        {
            id: 'movements',
            name: t('data.movements'),
            icon: Map,
            description: t('data.movementsDesc')
        }
    ];

    // Handle chart hover
    const handleChartHover = (data) => {
        setHoveredData(data);
    };

    // Render visualization based on active view
    const renderVisualization = () => {
        switch (activeView) {
            case 'economic':
                return <EconomicVisualization onDataChange={handleLiveDataChange} />;
            case 'class':
                return <ClassVisualization />;
            case 'trends':
                return <TrendsVisualization />;
            case 'movements':
                return <MovementsVisualization onDataChange={handleLiveDataChange} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full">
                        <EnhancedChart 
                            chartType={chartType}
                            dataType={activeView}
                            sentiment={sentiment}
                            enable3D={true}
                            onHover={handleChartHover}
                        />
                    </div>
                );
        }
    };

    return (
        <div className={s.page}>
            
            <main className={s.main}>
                <PageHeader
                    kicker="Data Desk"
                    title={t('data.title')}
                    note="Interactive charts and dashboards covering economic and social indicators."
                />
                
                <div className={s.vizGrid}>
                    {visualizations.map((viz) => (
                        <button
                            key={viz.id}
                            onClick={() => handleViewChange(viz.id)}
                            className={`${s.vizCard} ${activeView === viz.id ? s.vizCardActive : ''}`}
                        >
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                                <viz.icon size={22} className={activeView === viz.id ? s.vizIconActive : s.vizIcon} />
                                <span className={`${s.vizName} ${activeView === viz.id ? s.vizNameActive : ''}`}>
                                    {viz.name}
                                </span>
                            </div>
                            <p className={s.vizDesc}>{viz.description}</p>
                        </button>
                    ))}
                </div>
                
                {/* Control Bar */}
                <div className={s.toolbar}>
                    <div className={s.toolbarGroup}>
                        <button onClick={() => setChartType('bar')} className={`${s.toolBtn} ${chartType === 'bar' ? s.toolBtnActive : ''}`} title="Bar Chart">
                            <BarChart size={18} />
                        </button>
                        <button onClick={() => setChartType('line')} className={`${s.toolBtn} ${chartType === 'line' ? s.toolBtnActive : ''}`} title="Line Chart">
                            <LineChart size={18} />
                        </button>
                        <button onClick={() => setChartType('pie')} className={`${s.toolBtn} ${chartType === 'pie' ? s.toolBtnActive : ''}`} title="Pie Chart">
                            <PieChart size={18} />
                        </button>
                    </div>
                    
                    <div className={s.toolbarGroup}>
                        <button
                            onClick={() => setViewMode(viewMode === 'standard' ? 'split' : 'standard')}
                            className={`${s.toolBtn} ${viewMode === 'split' ? s.toolBtnActive : ''}`}
                            title={viewMode === 'standard' ? 'Switch to Split View' : 'Switch to Standard View'}
                            style={{width:'auto',padding:'0 12px',gap:8}}
                        >
                            <SplitSquareVertical size={18} />
                            <span>Split View</span>
                        </button>
                        
                        {viewMode === 'standard' && (
                            <button
                                onClick={() => setShowWhatIf(!showWhatIf)}
                                className={`${s.toolBtn} ${showWhatIf ? s.toolBtnActive : ''}`}
                                style={{width:'auto',padding:'0 12px',gap:8}}
                            >
                                <Sliders size={18} />
                                <span>{t('data.whatIf')}</span>
                            </button>
                        )}
                    </div>

                    <div className={s.toolbarGroup}>
                        <button
                            onClick={handleExportCSV}
                            className={s.toolBtn}
                            style={{width:'auto',padding:'0 12px',gap:8}}
                            title={t('common.exportCSV')}
                        >
                            <FileDown size={18} />
                            <span>{t('common.exportCSV')}</span>
                        </button>
                        <button
                            onClick={handleExportPNG}
                            className={s.toolBtn}
                            style={{width:'auto',padding:'0 12px',gap:8}}
                            title={t('common.exportPNG')}
                        >
                            <Download size={18} />
                            <span>{t('common.exportPNG')}</span>
                        </button>
                    </div>
                </div>

                {/* Visualization Content Area */}
                <div ref={chartRef} className={s.chartWrap} style={showTransition ? {opacity:0,transition:'opacity 300ms'} : {opacity:1,transition:'opacity 300ms'}}>
                    {/* Split View Mode */}
                    {viewMode === 'split' ? (
                        <SplitView 
                            chartType={chartType}
                            dataType={activeView}
                            title={visualizations.find(v => v.id === activeView)?.name || 'Data Visualization'}
                            description={visualizations.find(v => v.id === activeView)?.description || 'Interactive data visualization with what-if analysis'}
                        />
                    ) : (
                        <>
                            {/* What-If Analysis Panel - Conditionally Rendered */}
                            {showWhatIf && (
                                <div style={{marginBottom:24,padding:16,background:'rgba(0,0,0,0.4)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)'}}>
                                    <WhatIfAnalysis 
                                        dataType={activeView}
                                        onSentimentChange={setSentiment}
                                    />
                                </div>
                            )}
                            
                            {/* Data Tooltip */}
                            {hoveredData && (
                                <div style={{position:'absolute',top:16,left:16,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',padding:12,borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',zIndex:50}}>
                                    <h4 style={{fontSize:13,fontWeight:500}}>{hoveredData.label}</h4>
                                    <p style={{fontSize:12,color:'rgba(255,255,255,0.48)'}}>{hoveredData.value} {hoveredData.unit || ''}</p>
                                </div>
                            )}
                            
                            {/* Visualization Content */}
                            <div className="h-full">
                                {renderVisualization()}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DataVisualizationPage;