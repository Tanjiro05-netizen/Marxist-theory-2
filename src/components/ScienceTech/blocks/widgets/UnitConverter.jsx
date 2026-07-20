import React, { useState } from 'react';

const conversions = {
  length: {
    m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, mi: 1609.34,
  },
  mass: {
    kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495,
  },
  time: {
    s: 1, min: 60, hr: 3600, day: 86400, yr: 31536000,
  },
  speed: {
    'm/s': 1, 'km/h': 0.277778, 'mph': 0.44704, 'ft/s': 0.3048,
  },
  energy: {
    J: 1, kJ: 1000, cal: 4.184, kcal: 4184, 'Wh': 3600, kWh: 3600000,
  },
};

const UnitConverter = ({ config }) => {
  const { default_category = 'length' } = config || {};
  const [category, setCategory] = useState(default_category);
  const [fromUnit, setFromUnit] = useState(Object.keys(conversions[default_category])[0]);
  const [toUnit, setToUnit] = useState(Object.keys(conversions[default_category])[1]);
  const [value, setValue] = useState(1);

  const units = conversions[category];
  const cats = Object.keys(conversions);

  const result = value * (units[fromUnit] || 1) / (units[toUnit] || 1);

  return (
    <div className="bg-black/40 rounded-xl border border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={category}
          onChange={(e) => {
            const c = e.target.value;
            setCategory(c);
            const u = Object.keys(conversions[c]);
            setFromUnit(u[0]);
            setToUnit(u[1] || u[0]);
          }}
          className="bg-black/60 border border-gray-700 text-white text-sm rounded px-3 py-2"
        >
          {cats.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
          <input
            type="number" step="any" value={value}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="bg-transparent text-white text-lg font-mono w-24 outline-none"
          />
          <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}
            className="bg-black/60 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1">
            {Object.keys(units).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <span className="text-gray-500 text-lg">=</span>
        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
          <span className="text-green-400 text-lg font-mono w-24 truncate">
            {Number.isFinite(result) ? result.toPrecision(6) : '---'}
          </span>
          <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}
            className="bg-black/60 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1">
            {Object.keys(units).map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;
