import React, { useState } from 'react';
import EnhancedChart from './EnhancedChart';
import { Users, Briefcase, Building, Filter } from 'lucide-react';

const ClassVisualization = () => {
    const [chartType, setChartType] = useState('pie');
    const [filter, setFilter] = useState('all');
    const [hoveredData, setHoveredData] = useState(null);
    
    const filters = [
        { id: 'all', name: 'All Classes', icon: Users },
        { id: 'working', name: 'Working Class', icon: Briefcase },
        { id: 'capitalist', name: 'Capitalist Class', icon: Building }
    ];
    
    return (
        <div className="h-full flex flex-col">
            {/* Filter Controls */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-black/20 rounded-none">
                <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filter:</span>
                </div>
                
                <div className="flex gap-2">
                    {filters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-none transition-colors ${
                                filter === f.id 
                                ? 'bg-red-900/30 text-red-400 border border-red-500/30' 
                                : 'text-gray-400 hover:bg-black/30'
                            }`}
                        >
                            <f.icon className="w-4 h-4" />
                            <span className="text-sm">{f.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex justify-end mb-4">
                <div className="flex gap-2 p-2 bg-black/30 rounded-none">
                    <button
                        onClick={() => setChartType('pie')}
                        className={`px-3 py-1 rounded text-sm ${
                            chartType === 'pie' ? 'bg-red-900/30 text-red-400' : 'text-gray-400'
                        }`}
                    >
                        Pie
                    </button>
                    <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded text-sm ${
                            chartType === 'bar' ? 'bg-red-900/30 text-red-400' : 'text-gray-400'
                        }`}
                    >
                        Bar
                    </button>
                </div>
            </div>
            
            {/* Data Display */}
            {hoveredData && (
                <div className="mb-4 p-4 bg-black/30 rounded-none border border-gray-800/50">
                    <h3 className="text-lg text-white mb-2">{hoveredData.label}</h3>
                    <p className="text-gray-400">Value: {hoveredData.value}</p>
                </div>
            )}
            
            {/* Chart */}
            <div className="flex-1 min-h-[400px]">
                <EnhancedChart 
                    chartType={chartType}
                    dataType="class"
                    sentiment="neutral"
                    enable3D={true}
                    onHover={setHoveredData}
                />
            </div>
        </div>
    );
};

export default ClassVisualization;