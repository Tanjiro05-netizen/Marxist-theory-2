import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const WhatIfAnalysis = ({ dataType = 'economic', onSentimentChange = () => {}, inline = false }) => {
    const [isOpen, setIsOpen] = useState(inline);
    const [variables, setVariables] = useState([]);
    const [sentiment, setSentiment] = useState('neutral');
    
    // Initialize variables based on data type
    useEffect(() => {
        let initialVariables = [];
        
        switch(dataType) {
            case 'economic':
                initialVariables = [
                    { id: 'inequality', name: 'Wealth Inequality', value: 65, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'unemployment', name: 'Unemployment Rate', value: 12, min: 0, max: 30, step: 0.5, unit: '%' },
                    { id: 'wages', name: 'Real Wages', value: 45, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'profit', name: 'Profit Rate', value: 70, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'automation', name: 'Automation Level', value: 55, min: 0, max: 100, step: 1, unit: '%' }
                ];
                break;
            case 'class':
                initialVariables = [
                    { id: 'workingClass', name: 'Working Class Size', value: 60, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'middleClass', name: 'Middle Class Size', value: 30, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'bourgeoisie', name: 'Bourgeoisie Size', value: 10, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'classConsciousness', name: 'Class Consciousness', value: 35, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'solidarity', name: 'Worker Solidarity', value: 40, min: 0, max: 100, step: 1, unit: '%' }
                ];
                break;
            case 'trends':
                initialVariables = [
                    { id: 'capitalConcentration', name: 'Capital Concentration', value: 75, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'imperialism', name: 'Imperialist Expansion', value: 60, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'crisisFrequency', name: 'Crisis Frequency', value: 55, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'statePower', name: 'State Repression', value: 65, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'resistance', name: 'Popular Resistance', value: 50, min: 0, max: 100, step: 1, unit: '%' }
                ];
                break;
            case 'movements':
                initialVariables = [
                    { id: 'organization', name: 'Organization Level', value: 45, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'leadership', name: 'Leadership Quality', value: 50, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'theory', name: 'Theoretical Development', value: 60, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'international', name: 'International Support', value: 40, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'conditions', name: 'Material Conditions', value: 55, min: 0, max: 100, step: 1, unit: '%' }
                ];
                break;
            default:
                initialVariables = [
                    { id: 'var1', name: 'Variable 1', value: 50, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'var2', name: 'Variable 2', value: 50, min: 0, max: 100, step: 1, unit: '%' },
                    { id: 'var3', name: 'Variable 3', value: 50, min: 0, max: 100, step: 1, unit: '%' }
                ];
        }
        
        setVariables(initialVariables);
    }, [dataType]);
    
    // Calculate sentiment based on variables
    useEffect(() => {
        if (variables.length === 0) return;
        
        let score = 0;
        let totalWeight = 0;
        
        // Calculate weighted score based on data type
        switch(dataType) {
            case 'economic':
                // Lower inequality and unemployment are positive
                // Higher wages are positive
                // Higher profit rate is negative (for working class)
                // Higher automation can be negative
                score += (100 - variables.find(v => v.id === 'inequality')?.value || 50) * 0.3;
                score += (100 - variables.find(v => v.id === 'unemployment')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'wages')?.value || 50) * 0.3;
                score += (100 - variables.find(v => v.id === 'profit')?.value || 50) * 0.1;
                score += (100 - variables.find(v => v.id === 'automation')?.value || 50) * 0.1;
                totalWeight = 1.0;
                break;
                
            case 'class':
                // Higher working class size and consciousness are positive
                // Lower bourgeoisie size is positive
                // Higher solidarity is positive
                score += (variables.find(v => v.id === 'workingClass')?.value || 50) * 0.2;
                score += (100 - variables.find(v => v.id === 'bourgeoisie')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'classConsciousness')?.value || 50) * 0.3;
                score += (variables.find(v => v.id === 'solidarity')?.value || 50) * 0.3;
                totalWeight = 1.0;
                break;
                
            case 'trends':
                // Lower capital concentration is positive
                // Lower imperialism is positive
                // Lower crisis frequency is positive
                // Lower state power is positive
                // Higher resistance is positive
                score += (100 - variables.find(v => v.id === 'capitalConcentration')?.value || 50) * 0.2;
                score += (100 - variables.find(v => v.id === 'imperialism')?.value || 50) * 0.2;
                score += (100 - variables.find(v => v.id === 'crisisFrequency')?.value || 50) * 0.1;
                score += (100 - variables.find(v => v.id === 'statePower')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'resistance')?.value || 50) * 0.3;
                totalWeight = 1.0;
                break;
                
            case 'movements':
                // Higher values for all are positive
                score += (variables.find(v => v.id === 'organization')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'leadership')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'theory')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'international')?.value || 50) * 0.2;
                score += (variables.find(v => v.id === 'conditions')?.value || 50) * 0.2;
                totalWeight = 1.0;
                break;
                
            default:
                // Simple average
                variables.forEach(v => {
                    score += v.value;
                    totalWeight += 1;
                });
        }
        
        // Normalize to 0-100
        const normalizedScore = totalWeight > 0 ? score / totalWeight : 50;
        
        // Determine sentiment
        let newSentiment;
        if (normalizedScore >= 65) {
            newSentiment = 'positive';
        } else if (normalizedScore <= 35) {
            newSentiment = 'negative';
        } else {
            newSentiment = 'neutral';
        }
        
        setSentiment(newSentiment);
        
        // Notify parent component
        if (onSentimentChange) {
            onSentimentChange(newSentiment);
        }
    }, [variables, dataType, onSentimentChange]);
    
    const handleVariableChange = (id, newValue) => {
        setVariables(variables.map(variable => 
            variable.id === id ? { ...variable, value: newValue } : variable
        ));
    };
    
    const resetVariables = () => {
        // Reset to initial values based on data type
        setVariables(prevVariables => 
            prevVariables.map(variable => {
                let defaultValue = 50;
                
                // Set specific default values based on data type and variable
                if (dataType === 'economic') {
                    if (variable.id === 'inequality') defaultValue = 65;
                    if (variable.id === 'unemployment') defaultValue = 12;
                    if (variable.id === 'wages') defaultValue = 45;
                    if (variable.id === 'profit') defaultValue = 70;
                    if (variable.id === 'automation') defaultValue = 55;
                }
                
                return { ...variable, value: defaultValue };
            })
        );
    };
    
    return (
        <div className={`${inline ? 'what-if-analysis-inline' : 'what-if-analysis'} ${isOpen ? 'open' : ''}`}>
            <button 
                className="toggle-button" 
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>What-If Analysis</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isOpen && (
                <div className="analysis-content">
                    <div className="analysis-header">
                        <h3>Adjust variables to see potential outcomes</h3>
                        <button className="reset-button" onClick={resetVariables}>
                            <RefreshCw size={14} />
                            <span>Reset</span>
                        </button>
                    </div>
                    
                    <div className="variables-container">
                        {variables.map(variable => (
                            <div key={variable.id} className="variable-item">
                                <div className="variable-header">
                                    <span className="variable-name">{variable.name}</span>
                                    <span className="variable-value">
                                        {variable.value}{variable.unit}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={variable.min}
                                    max={variable.max}
                                    step={variable.step}
                                    value={variable.value}
                                    className={`variable-slider ${sentiment}`}
                                    onChange={(e) => handleVariableChange(variable.id, parseFloat(e.target.value))}
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="analysis-footer">
                        <div className={`outcome-indicator ${sentiment}`}>
                            <span className="outcome-label">Projected Outcome:</span>
                            <span className="outcome-value">
                                {sentiment === 'positive' ? 'Favorable' : 
                                 sentiment === 'negative' ? 'Unfavorable' : 'Neutral'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatIfAnalysis;
