import React, { useState, useEffect } from 'react';

// A curated list of countries with Marxist historical relevance
const FEATURED_COUNTRIES = [
  { id: 'RUS', name: 'Russia', color: '#e6194B' },
  { id: 'CHN', name: 'China', color: '#f58231' },
  { id: 'CUB', name: 'Cuba', color: '#ffe119' },
  { id: 'VNM', name: 'Vietnam', color: '#bfef45' },
  { id: 'DEU', name: 'Germany', color: '#3cb44b' },
  { id: 'VEN', name: 'Venezuela', color: '#42d4f4' },
  { id: 'USA', name: 'United States', color: '#4363d8' },
  { id: 'GBR', name: 'United Kingdom', color: '#911eb4' },
  { id: 'FRA', name: 'France', color: '#f032e6' },
  { id: 'BRA', name: 'Brazil', color: '#a5a194' },
  { id: 'IND', name: 'India', color: '#800000' },
  { id: 'ZAF', name: 'South Africa', color: '#9A6324' },
  { id: 'MEX', name: 'Mexico', color: '#808000' },
  { id: 'KOR', name: 'South Korea', color: '#469990' },
  { id: 'JPN', name: 'Japan', color: '#000075' },
];

// Regions with Marxist or economic significance
const REGIONS = [
  { id: 'world', name: 'Global' },
  { id: 'east_asia', name: 'East Asia & Pacific' },
  { id: 'europe', name: 'Europe & Central Asia' },
  { id: 'americas', name: 'Americas' },
  { id: 'africa', name: 'Africa' },
  { id: 'south_asia', name: 'South Asia' },
  { id: 'middle_east', name: 'Middle East & North Africa' },
];

const CountrySelector = ({ selectedCountries, onCountriesChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('world');
  const [availableCountries, setAvailableCountries] = useState(FEATURED_COUNTRIES);
  
  // Filter countries based on search term and region
  useEffect(() => {
    let filtered = FEATURED_COUNTRIES;
    
    if (searchTerm) {
      filtered = filtered.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setAvailableCountries(filtered);
  }, [searchTerm, selectedRegion]);
  
  const toggleCountry = (countryId) => {
    if (selectedCountries.includes(countryId)) {
      onCountriesChange(selectedCountries.filter(id => id !== countryId));
    } else {
      onCountriesChange([...selectedCountries, countryId]);
    }
  };
  
  // Get color for a specific country
  const getCountryColor = (countryId) => {
    const country = FEATURED_COUNTRIES.find(c => c.id === countryId);
    return country ? country.color : '#c9c5b8';
  };
  
  return (
    <div className="bg-black/40 p-4 rounded-none border border-gray-800 mb-6">
      <h3 className="text-white font-semibold mb-3">Select Countries</h3>
      
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Region selector */}
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full bg-black/50 border border-gray-700 text-white rounded-none px-3 py-2"
          >
            {REGIONS.map(region => (
              <option key={region.id} value={region.id}>{region.name}</option>
            ))}
          </select>
        </div>
        
        {/* Search input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-gray-700 text-white rounded-none px-3 py-2"
          />
        </div>
      </div>
      
      {/* Selected countries */}
      <div className="mb-4">
        <h4 className="text-gray-400 text-sm mb-2">Selected:</h4>
        <div className="flex flex-wrap gap-2">
          {selectedCountries.length === 0 ? (
            <span className="text-gray-500 text-sm">No countries selected</span>
          ) : (
            selectedCountries.map(countryId => {
              const country = FEATURED_COUNTRIES.find(c => c.id === countryId);
              return country ? (
                <button
                  key={country.id}
                  onClick={() => toggleCountry(country.id)}
                  className="flex items-center space-x-1 bg-opacity-20 rounded px-2 py-1 text-sm"
                  style={{ backgroundColor: `${country.color}30`, borderColor: country.color }}
                >
                  <span style={{ color: country.color }}>{country.name}</span>
                  <span className="text-gray-400">×</span>
                </button>
              ) : null;
            })
          )}
        </div>
      </div>
      
      {/* Available countries */}
      <div>
        <h4 className="text-gray-400 text-sm mb-2">Countries:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {availableCountries.map(country => (
            <button
              key={country.id}
              onClick={() => toggleCountry(country.id)}
              className={`text-left px-2 py-1 rounded text-sm transition-colors ${
                selectedCountries.includes(country.id)
                  ? 'bg-opacity-30 border border-opacity-50'
                  : 'bg-black/30 border border-gray-800 hover:border-gray-700'
              }`}
              style={{
                backgroundColor: selectedCountries.includes(country.id) ? `${country.color}20` : undefined,
                borderColor: selectedCountries.includes(country.id) ? country.color : undefined
              }}
            >
              {country.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountrySelector;
