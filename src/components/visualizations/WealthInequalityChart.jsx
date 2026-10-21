import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

const WealthInequalityChart = ({ data, countries }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Enhanced tooltip with more detailed information
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-slate-900 border border-slate-700 p-4 rounded-none shadow-none">
          <p className="text-white font-semibold mb-2">{`Year: ${label}`}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div 
                key={`item-${index}`} 
                className="flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <p style={{ color: entry.color }}>
                  {`${entry.name}: ${entry.value.toFixed(2)}`}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">*Higher GINI values indicate greater inequality</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      className="bg-[#10131b] from-slate-900/80 via-gray-900/70 to-black/60 p-6 rounded-none shadow-none backdrop-blur-sm transition-all duration-300 hover:shadow-none border border-slate-800 hover:border-slate-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      <h3 className="text-xl font-bold text-white mb-4">Wealth Inequality Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          data={data}
          onMouseMove={(e) => {
            if (e.activePayload) {
              setHoveredPoint(e.activePayload[0].payload);
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <XAxis 
            dataKey="year" 
            stroke="#7d7a6e"
            tick={{ fill: '#a5a194' }}
          />
          <YAxis 
            stroke="#7d7a6e"
            tick={{ fill: '#a5a194' }}
            label={{ 
              value: 'GINI Index', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#a5a194' }
            }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
          />
          <Legend 
            iconType="circle"
            wrapperStyle={{ paddingTop: 10 }}
          />
          <ReferenceLine
            y={40}
            stroke="#d41f3d"
            strokeDasharray="3 3"
            label={{ 
              value: "High Inequality", 
              position: "insideTopRight",
              fill: "#d41f3d",
              fontSize: 12
            }}
          />
          {countries.map((country, index) => (
            <Line
              key={country}
              type="monotone"
              dataKey={country}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ 
                r: 8, 
                stroke: "white", 
                strokeWidth: 2, 
                fill: COLORS[index % COLORS.length] 
              }}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {hoveredPoint && (
        <div className="mt-4 p-3 bg-slate-800/50 rounded-none">
          <p className="text-sm text-white">
            <span className="font-semibold">Year {hoveredPoint.year}:</span> {" "}
            Average GINI index across selected countries: {
              (Object.entries(hoveredPoint)
                .filter(([key]) => countries.includes(key))
                .reduce((sum, [_, value]) => sum + value, 0) / countries.length)
                .toFixed(2)
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

// A consistent color palette
const COLORS = [
  '#4a7fb5', // blue
  '#d41f3d', // red
  '#2d8a4e', // green
  '#c8860a', // amber
  '#6f6a9e', // purple
  '#d41f3d', // pink
  '#4a7fb5', // cyan
  '#c8860a', // orange
];

export default WealthInequalityChart;
