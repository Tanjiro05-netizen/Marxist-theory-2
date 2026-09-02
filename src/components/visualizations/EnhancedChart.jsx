import React, { useState, useEffect, useRef } from 'react';
import './EnhancedChart.css';

// Sample data for demonstration purposes
const generateSampleData = (type, sentiment) => {
    const dataPoints = 12;
    let data = [];
    
    switch (type) {
        case 'economic':
            data = Array(dataPoints).fill().map((_, i) => ({
                label: `Month ${i + 1}`,
                value: sentiment === 'negative' 
                    ? 100 - Math.random() * 50 - i * 3
                    : Math.random() * 50 + i * 3,
                color: sentiment === 'negative' ? '#d41f3d' : '#2d8a4e'
            }));
            break;
        case 'class':
            data = [
                { label: 'Working Class', value: 68, color: '#d41f3d' },
                { label: 'Middle Class', value: 24, color: '#d8c79f' },
                { label: 'Upper Class', value: 8, color: '#2d8a4e' }
            ];
            break;
        case 'trends':
            data = Array(dataPoints).fill().map((_, i) => ({
                label: `Year ${2010 + i}`,
                value: sentiment === 'negative'
                    ? 80 - Math.sin(i * 0.5) * 30
                    : 20 + Math.sin(i * 0.5) * 30,
                color: i % 2 === 0 ? '#d41f3d' : '#2d8a4e'
            }));
            break;
        case 'movements':
            data = [
                { label: 'North America', value: 35, color: '#d41f3d' },
                { label: 'South America', value: 45, color: '#d8c79f' },
                { label: 'Europe', value: 55, color: '#2d8a4e' },
                { label: 'Africa', value: 25, color: '#4a7fb5' },
                { label: 'Asia', value: 65, color: '#8a84b8' },
                { label: 'Oceania', value: 15, color: '#4a7fb5' }
            ];
            break;
        default:
            data = Array(dataPoints).fill().map((_, i) => ({
                label: `Item ${i + 1}`,
                value: Math.random() * 100,
                color: `hsl(${i * 30}, 70%, 50%)`
            }));
    }
    
    return data;
};

const EnhancedChart = ({ 
    chartType = 'bar', 
    dataType = 'economic', 
    sentiment = 'neutral',
    animate = true,
    interactive = true,
    enable3D = true,
    onHover = () => {}
}) => {
    const [data, setData] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const chartRef = useRef(null);
    
    // Initialize data
    useEffect(() => {
        setIsAnimating(true);
        setData(generateSampleData(dataType, sentiment));
        
        const timer = setTimeout(() => {
            setIsAnimating(false);
        }, 1000);
        
        return () => clearTimeout(timer);
    }, [dataType, sentiment]);
    
    // Handle hover
    const handleItemHover = (index) => {
        if (!interactive) return;
        
        setHoveredIndex(index);
        if (index !== null) {
            onHover(data[index]);
        } else {
            onHover(null);
        }
    };
    
    // Render bar chart
    const renderBarChart = () => {
        const maxValue = Math.max(...data.map(item => item.value));
        
        return (
            <div className="enhanced-chart-container">
                <div className="chart-bars" ref={chartRef}>
                    {data.map((item, index) => (
                        <div 
                            key={index}
                            className={`chart-bar ${enable3D ? 'bar-3d' : ''} ${hoveredIndex === index ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
                            style={{ 
                                height: `${(item.value / maxValue) * 100}%`,
                                backgroundColor: item.color,
                                animationDelay: `${index * 0.05}s`
                            }}
                            onMouseEnter={() => handleItemHover(index)}
                            onMouseLeave={() => handleItemHover(null)}
                        >
                            <div className="bar-value">{Math.round(item.value)}</div>
                        </div>
                    ))}
                </div>
                <div className="chart-labels">
                    {data.map((item, index) => (
                        <div 
                            key={index} 
                            className="chart-label"
                            onMouseEnter={() => handleItemHover(index)}
                            onMouseLeave={() => handleItemHover(null)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    // Render line chart
    const renderLineChart = () => {
        const maxValue = Math.max(...data.map(item => item.value));
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 100;
            return `${x},${y}`;
        }).join(' ');
        
        return (
            <div className="enhanced-chart-container">
                <div className="chart-line-container" ref={chartRef}>
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                            className={`chart-line ${isAnimating ? 'animating' : ''}`}
                            points={points}
                            fill="none"
                            stroke={sentiment === 'negative' ? '#d41f3d' : '#2d8a4e'}
                            strokeWidth="2"
                        />
                        {data.map((item, index) => {
                            const x = (index / (data.length - 1)) * 100;
                            const y = 100 - (item.value / maxValue) * 100;
                            return (
                                <circle
                                    key={index}
                                    className={`chart-point ${hoveredIndex === index ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
                                    cx={x}
                                    cy={y}
                                    r="2"
                                    fill={item.color}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    onMouseEnter={() => handleItemHover(index)}
                                    onMouseLeave={() => handleItemHover(null)}
                                />
                            );
                        })}
                    </svg>
                    {hoveredIndex !== null && (
                        <div 
                            className="point-tooltip"
                            style={{ 
                                left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                                top: `${100 - (data[hoveredIndex].value / maxValue) * 100}%`
                            }}
                        >
                            <div>{data[hoveredIndex].label}</div>
                            <div>{Math.round(data[hoveredIndex].value)}</div>
                        </div>
                    )}
                </div>
                <div className="chart-labels">
                    {data.map((item, index) => (
                        <div 
                            key={index} 
                            className="chart-label"
                            onMouseEnter={() => handleItemHover(index)}
                            onMouseLeave={() => handleItemHover(null)}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    // Render pie chart
    const renderPieChart = () => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        return (
            <div className="enhanced-chart-container pie-container">
                <div className={`pie-chart ${enable3D ? 'pie-3d' : ''}`} ref={chartRef}>
                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                        {data.map((item, index) => {
                            const startAngle = currentAngle;
                            const percentage = item.value / total;
                            const angleSize = percentage * 360;
                            currentAngle += angleSize;
                            
                            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                            const endAngleRad = (startAngle + angleSize - 90) * (Math.PI / 180);
                            
                            const x1 = 50 + 50 * Math.cos(startAngleRad);
                            const y1 = 50 + 50 * Math.sin(startAngleRad);
                            const x2 = 50 + 50 * Math.cos(endAngleRad);
                            const y2 = 50 + 50 * Math.sin(endAngleRad);
                            
                            const largeArcFlag = angleSize > 180 ? 1 : 0;
                            
                            const pathData = [
                                `M 50 50`,
                                `L ${x1} ${y1}`,
                                `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                `Z`
                            ].join(' ');
                            
                            return (
                                <path
                                    key={index}
                                    className={`pie-segment ${hoveredIndex === index ? 'hovered' : ''} ${isAnimating ? 'animating' : ''}`}
                                    d={pathData}
                                    fill={item.color}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                    onMouseEnter={() => handleItemHover(index)}
                                    onMouseLeave={() => handleItemHover(null)}
                                />
                            );
                        })}
                    </svg>
                </div>
                <div className="pie-legend">
                    {data.map((item, index) => (
                        <div 
                            key={index} 
                            className={`legend-item ${hoveredIndex === index ? 'hovered' : ''}`}
                            onMouseEnter={() => handleItemHover(index)}
                            onMouseLeave={() => handleItemHover(null)}
                        >
                            <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                            <div className="legend-label">{item.label}</div>
                            <div className="legend-value">{Math.round(item.value)}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    
    // Render chart based on type
    const renderChart = () => {
        switch (chartType) {
            case 'bar': return renderBarChart();
            case 'line': return renderLineChart();
            case 'pie': return renderPieChart();
            default: return renderBarChart();
        }
    };
    
    return (
        <div className={`enhanced-chart ${chartType}-chart ${sentiment}`}>
            {renderChart()}
        </div>
    );
};

export default EnhancedChart;
