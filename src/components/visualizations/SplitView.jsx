import React, { useState } from 'react';
import EnhancedChart from './EnhancedChart';
import WhatIfAnalysis from './WhatIfAnalysis';

const SplitView = ({ 
    chartType = 'bar',
    dataType = 'economic',
    data = null,
    title = 'Data Visualization',
    description = 'Interactive data visualization with what-if analysis'
}) => {
    const [sentiment, setSentiment] = useState(0);
    
    const handleSentimentChange = (newSentiment) => {
        setSentiment(newSentiment);
    };
    
    return (
        <div className="split-view-container">
            <div className="split-view-header">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            
            <div className="split-view-content">
                <div className="chart-container">
                    <EnhancedChart 
                        type={chartType}
                        dataType={dataType}
                        data={data}
                        sentiment={sentiment > 20 ? 'positive' : sentiment < -20 ? 'negative' : 'neutral'}
                    />
                </div>
                
                <div className="analysis-container">
                    <WhatIfAnalysis 
                        dataType={dataType}
                        onSentimentChange={handleSentimentChange}
                        inline={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default SplitView;
