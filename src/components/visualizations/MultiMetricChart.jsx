import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceArea
} from 'recharts';

const METRICS = [
  { id: 'GINI', name: 'GINI Index', description: 'Measures wealth inequality (0-100)', color: '#d41f3d' },
  { id: 'GDP_PER_CAPITA', name: 'GDP Per Capita', description: 'Average economic output per person', color: '#4a7fb5' },
  { id: 'LABOR_SHARE', name: 'Labor Share of GDP', description: 'Percentage of GDP going to workers', color: '#2d8a4e' },
  { id: 'UNEMPLOYMENT', name: 'Unemployment Rate', description: 'Percentage of workforce without jobs', color: '#c8860a' },
  { id: 'TOP10_INCOME', name: 'Top 10% Income Share', description: 'Income captured by the richest 10%', color: '#6f6a9e' },
];

// Economic crisis periods for reference highlighting
const CRISIS_PERIODS = [
  { name: '1929 Wall Street Crash', start: 1929, end: 1933, color: 'rgba(239, 68, 68, 0.1)' },
  { name: '1970s Oil Crisis', start: 1973, end: 1975, color: 'rgba(239, 68, 68, 0.1)' },
  { name: '2008 Financial Crisis', start: 2007, end: 2009, color: 'rgba(239, 68, 68, 0.1)' },
  { name: 'COVID-19 Pandemic', start: 2020, end: 2022, color: 'rgba(239, 68, 68, 0.1)' },
];

const MultiMetricChart = ({ 
  data, 
  countries, 
  countryColors, 
  metricId = 'GINI', 
  showCrisisPeriods = true 
}) => {
  const [selectedMetric, setSelectedMetric] = useState(metricId);
  const [zoomedDomain, setZoomedDomain] = useState(null);
  const [startZoom, setStartZoom] = useState(null);
  
  // Get the selected metric configuration
  const metric = METRICS.find(m => m.id === selectedMetric) || METRICS[0];
  
  // Format tooltip values
  const formatValue = (value) => {
    if (value === undefined || value === null) return 'No data';
    
    switch(selectedMetric) {
      case 'GINI':
        return value.toFixed(1);
      case 'GDP_PER_CAPITA':
        return `$${value.toLocaleString()}`;
      case 'LABOR_SHARE':
      case 'UNEMPLOYMENT':
      case 'TOP10_INCOME':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };
  
  // Handle mouse events for zooming
  const handleMouseDown = (e) => {
    if (!e) return;
    setStartZoom(e.activeLabel);
  };
  
  const handleMouseMove = (e) => {
    if (!e || !startZoom) return;
  };
  
  const handleMouseUp = (e) => {
    if (!e || !startZoom) return;
    
    const endZoom = e.activeLabel;
    if (endZoom === startZoom) {
      setStartZoom(null);
      return;
    }
    
    // Ensure start is before end
    const start = Math.min(startZoom, endZoom);
    const end = Math.max(startZoom, endZoom);
    
    setZoomedDomain([start, end]);
    setStartZoom(null);
  };
  
  const resetZoom = () => {
    setZoomedDomain(null);
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-none">
        <p className="text-white font-medium">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-medium">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-black/30 p-6 rounded-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white mb-2 md:mb-0">{metric.name}</h3>
        
        <div className="flex flex-wrap gap-2">
          {METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMetric(m.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedMetric === m.id
                  ? 'bg-opacity-30 border'
                  : 'bg-black/30 hover:bg-black/50 border border-gray-800'
              }`}
              style={{
                backgroundColor: selectedMetric === m.id ? `${m.color}20` : undefined,
                borderColor: selectedMetric === m.id ? m.color : undefined,
                color: selectedMetric === m.id ? m.color : 'white'
              }}
            >
              {m.name}
            </button>
          ))}
          
          {zoomedDomain && (
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-sm rounded-full bg-black/30 hover:bg-black/50 border border-gray-800 text-white"
            >
              Reset Zoom
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-400 mb-6">{metric.description}</p>
      
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262a35" />
            <XAxis 
              dataKey="year" 
              stroke="#7d7a6e"
              domain={zoomedDomain || ['auto', 'auto']}
            />
            <YAxis 
              stroke="#7d7a6e"
              tickFormatter={formatValue}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value) => <span style={{ color: '#ece9e0' }}>{value}</span>}
            />
            
            {/* Crisis period reference areas */}
            {showCrisisPeriods && CRISIS_PERIODS.map((period) => (
              <ReferenceArea 
                key={period.name}
                x1={period.start} 
                x2={period.end} 
                fill={period.color}
                fillOpacity={0.3}
                stroke="rgba(239, 68, 68, 0.5)"
                strokeDasharray="3 3"
                ifOverflow="extendDomain"
              />
            ))}
            
            {/* Lines for each country */}
            {countries.map((country) => (
              <Line
                key={country}
                type="monotone"
                dataKey={country}
                name={country}
                stroke={countryColors[country] || '#c9c5b8'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Historical crisis legend */}
      {showCrisisPeriods && (
        <div className="mt-6">
          <h4 className="text-white text-sm font-medium mb-2">Economic Crisis Periods:</h4>
          <div className="flex flex-wrap gap-3">
            {CRISIS_PERIODS.map(period => (
              <div key={period.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <span className="text-gray-400 text-sm">{period.name} ({period.start}-{period.end})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiMetricChart;
