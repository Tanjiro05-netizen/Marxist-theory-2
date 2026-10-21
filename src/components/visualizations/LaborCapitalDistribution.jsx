import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, Sector } from 'recharts';
import { motion } from 'framer-motion';

// Enhanced color palette with meaning
const COLORS = {
  labor: '#4a7fb5',      // Blue for labor
  capital: '#d41f3d',    // Red for capital
  other: '#6f6a9e'       // Purple for other categories
};

const LaborCapitalDistribution = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Custom tooltip with enhanced information
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, payload: fullPayload } = payload[0];
      return (
        <div className="custom-tooltip bg-slate-900 border border-slate-700 p-4 rounded-none shadow-none">
          <p className="text-white font-semibold mb-1">{name}</p>
          <p className="text-gray-300">
            <span className="font-medium">{value}%</span> of economic distribution
          </p>
          {fullPayload.description && (
            <p className="text-xs text-gray-400 mt-2">{fullPayload.description}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Animation for active sector
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={fill}
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 15}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  // Enhanced data with descriptions
  const enhancedData = data.map(item => ({
    ...item,
    description: item.name === 'Labor' 
      ? 'Portion of economic output allocated to workers through wages and benefits'
      : item.name === 'Capital'
        ? 'Portion of economic output allocated to owners of capital through profits, interest, and rent'
        : 'Other economic factors and distributions'
  }));

  return (
    <motion.div 
      className="bg-[#10131b] from-slate-900/80 via-gray-900/70 to-black/60 p-6 rounded-none shadow-none backdrop-blur-sm transition-all duration-300 hover:shadow-none border border-slate-800 hover:border-slate-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01 }}
    >
      <h3 className="text-xl font-bold text-white mb-4">Labor vs Capital Distribution</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={enhancedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8a84b8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            animationBegin={200}
            animationDuration={1500}
          >
            {enhancedData.map((entry, index) => {
              const colorKey = entry.name.toLowerCase();
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[colorKey] || COLORS.other} 
                  stroke="#10131b"
                  strokeWidth={2}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {enhancedData.map((entry, index) => (
          <motion.div 
            key={`stat-${index}`}
            className={`p-3 rounded-none text-center ${activeIndex === index ? 'bg-slate-800/80' : 'bg-slate-800/30'}`}
            whileHover={{ y: -5 }}
            onHover={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <p className="text-sm text-gray-400">{entry.name}</p>
            <p className="text-2xl font-bold" style={{ color: COLORS[entry.name.toLowerCase()] || COLORS.other }}>{entry.value}%</p>
          </motion.div>
        ))}
      </div>
      
      <p className="text-sm text-gray-500 mt-6">
        *Historical data showing the distribution of economic output between labor and capital
      </p>
    </motion.div>
  );
};

export default LaborCapitalDistribution;
