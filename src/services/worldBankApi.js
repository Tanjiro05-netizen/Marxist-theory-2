/**
 * World Bank API Service
 * Free API - No authentication required
 * Documentation: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 */

const BASE_URL = 'https://api.worldbank.org/v2';

// Economic indicators available from World Bank
export const INDICATORS = {
  // GDP & Growth
  GDP_CURRENT: { id: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)', format: 'currency', unit: 'USD' },
  GDP_GROWTH: { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth (annual %)', format: 'percent', unit: '%' },
  GDP_PER_CAPITA: { id: 'NY.GDP.PCAP.CD', name: 'GDP per capita (current US$)', format: 'currency', unit: 'USD' },
  
  // Inflation & Prices
  INFLATION: { id: 'FP.CPI.TOTL.ZG', name: 'Inflation, consumer prices (annual %)', format: 'percent', unit: '%' },
  
  // Employment
  UNEMPLOYMENT: { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment (% of total labor force)', format: 'percent', unit: '%' },
  LABOR_FORCE: { id: 'SL.TLF.TOTL.IN', name: 'Labor force, total', format: 'number', unit: '' },
  
  // Inequality & Poverty
  GINI_INDEX: { id: 'SI.POV.GINI', name: 'Gini Index (World Bank estimate)', format: 'number', unit: '' },
  POVERTY_RATIO: { id: 'SI.POV.DDAY', name: 'Poverty headcount ratio at $2.15/day (%)', format: 'percent', unit: '%' },
  
  // Trade
  EXPORTS: { id: 'NE.EXP.GNFS.ZS', name: 'Exports of goods and services (% of GDP)', format: 'percent', unit: '%' },
  IMPORTS: { id: 'NE.IMP.GNFS.ZS', name: 'Imports of goods and services (% of GDP)', format: 'percent', unit: '%' },
  TRADE_BALANCE: { id: 'NE.RSB.GNFS.ZS', name: 'External balance on goods and services (% of GDP)', format: 'percent', unit: '%' },
  
  // Government & Debt
  GOVT_DEBT: { id: 'GC.DOD.TOTL.GD.ZS', name: 'Central government debt (% of GDP)', format: 'percent', unit: '%' },
  GOVT_EXPENDITURE: { id: 'NE.CON.GOVT.ZS', name: 'Government expenditure (% of GDP)', format: 'percent', unit: '%' },
  
  // Industry & Agriculture
  INDUSTRY_VALUE: { id: 'NV.IND.TOTL.ZS', name: 'Industry (% of GDP)', format: 'percent', unit: '%' },
  AGRICULTURE_VALUE: { id: 'NV.AGR.TOTL.ZS', name: 'Agriculture (% of GDP)', format: 'percent', unit: '%' },
  SERVICES_VALUE: { id: 'NV.SRV.TOTL.ZS', name: 'Services (% of GDP)', format: 'percent', unit: '%' },
  
  // Population
  POPULATION: { id: 'SP.POP.TOTL', name: 'Population, total', format: 'number', unit: '' },
  POPULATION_GROWTH: { id: 'SP.POP.GROW', name: 'Population growth (annual %)', format: 'percent', unit: '%' },
};

// Country code mapping for World Bank API (ISO 3166-1 alpha-2 → alpha-3)
const COUNTRY_CODE_MAP = {
  'US': 'USA',
  'GB': 'GBR',
  'CN': 'CHN',
  'RU': 'RUS',
  'DE': 'DEU',
  'FR': 'FRA',
  'JP': 'JPN',
  'IN': 'IND',
  'BR': 'BRA',
  'KR': 'KOR',
  'CA': 'CAN',
  'AU': 'AUS',
  'IT': 'ITA',
  'ES': 'ESP',
  'MX': 'MEX',
  'ID': 'IDN',
  'NL': 'NLD',
  'SA': 'SAU',
  'TR': 'TUR',
  'CH': 'CHE',
  'PL': 'POL',
  'SE': 'SWE',
  'ZA': 'ZAF',
  'NG': 'NGA',
  'WORLD': 'WLD',
};

// All available countries for comparison with assigned colors
export const COMPARISON_COUNTRIES = [
  { code: 'US', name: 'United States', color: '#4a7fb5' },
  { code: 'CN', name: 'China', color: '#d41f3d' },
  { code: 'JP', name: 'Japan', color: '#2d8a4e' },
  { code: 'DE', name: 'Germany', color: '#c8860a' },
  { code: 'GB', name: 'United Kingdom', color: '#8a84b8' },
  { code: 'IN', name: 'India', color: '#4a7fb5' },
  { code: 'FR', name: 'France', color: '#d41f3d' },
  { code: 'BR', name: 'Brazil', color: '#14b8a6' },
  { code: 'RU', name: 'Russia', color: '#c8860a' },
  { code: 'CA', name: 'Canada', color: '#8a84b8' },
  { code: 'AU', name: 'Australia', color: '#eab308' },
  { code: 'KR', name: 'South Korea', color: '#64748b' },
  { code: 'IT', name: 'Italy', color: '#2d8a4e' },
  { code: 'ES', name: 'Spain', color: '#f43f5e' },
  { code: 'MX', name: 'Mexico', color: '#0ea5e9' },
  { code: 'ID', name: 'Indonesia', color: '#84cc16' },
  { code: 'NL', name: 'Netherlands', color: '#fb923c' },
  { code: 'SA', name: 'Saudi Arabia', color: '#22d3ee' },
  { code: 'TR', name: 'Turkey', color: '#e879f9' },
  { code: 'CH', name: 'Switzerland', color: '#fbbf24' },
  { code: 'PL', name: 'Poland', color: '#4ade80' },
  { code: 'SE', name: 'Sweden', color: '#38bdf8' },
  { code: 'ZA', name: 'South Africa', color: '#c084fc' },
  { code: 'NG', name: 'Nigeria', color: '#fb7185' },
];

// Default selected countries for comparison
export const DEFAULT_COMPARISON = ['US', 'CN', 'JP', 'DE', 'GB', 'IN', 'FR', 'BR'];

/**
 * Get the World Bank country code
 */
const getWBCountryCode = (code) => {
  return COUNTRY_CODE_MAP[code] || code;
};

/**
 * Fetch indicator data for a specific country
 * @param {string} countryCode - ISO country code
 * @param {string} indicatorId - World Bank indicator ID
 * @param {number} startYear - Start year for data range
 * @param {number} endYear - End year for data range
 */
export const fetchIndicatorData = async (countryCode, indicatorId, startYear, endYear) => {
  const wbCode = getWBCountryCode(countryCode);
  const url = `${BASE_URL}/country/${wbCode}/indicator/${indicatorId}?format=json&date=${startYear}:${endYear}&per_page=100`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // World Bank API returns [metadata, data] array
    if (!data || !data[1]) {
      return [];
    }
    
    // Transform and sort data by year
    return data[1]
      .filter(item => item.value !== null)
      .map(item => ({
        year: parseInt(item.date),
        value: item.value,
        country: item.country.value,
        countryCode: item.countryiso3code,
        indicator: item.indicator.value,
      }))
      .sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error('Error fetching World Bank data:', error);
    throw error;
  }
};

/**
 * Fetch multiple indicators for a country
 */
export const fetchMultipleIndicators = async (countryCode, indicatorIds, startYear, endYear) => {
  const promises = indicatorIds.map(id => 
    fetchIndicatorData(countryCode, id, startYear, endYear)
  );
  
  const results = await Promise.all(promises);
  
  return indicatorIds.reduce((acc, id, index) => {
    acc[id] = results[index];
    return acc;
  }, {});
};

/**
 * Fetch data for multiple countries for comparison
 */
export const fetchCountryComparison = async (countryCodes, indicatorId, startYear, endYear) => {
  const promises = countryCodes.map(code =>
    fetchIndicatorData(code, indicatorId, startYear, endYear)
  );
  
  const results = await Promise.all(promises);
  
  return countryCodes.reduce((acc, code, index) => {
    acc[code] = results[index];
    return acc;
  }, {});
};

/**
 * Calculate statistics from data array
 */
export const calculateStats = (data) => {
  if (!data || data.length === 0) {
    return { current: null, previous: null, change: null, average: null, min: null, max: null };
  }
  
  const values = data.map(d => d.value);
  const current = data[data.length - 1]?.value;
  const previous = data[data.length - 2]?.value;
  const change = previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return {
    current,
    currentYear: data[data.length - 1]?.year,
    previous,
    previousYear: data[data.length - 2]?.year,
    change,
    average,
    min,
    max,
    dataPoints: data.length,
  };
};

/**
 * Format value based on indicator type
 */
export const formatValue = (value, format, compact = false) => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (format) {
    case 'currency':
      if (compact) {
        if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toLocaleString()}`;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    
    case 'percent':
      return `${value.toFixed(2)}%`;
    
    case 'number':
      if (compact) {
        if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
      }
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    
    default:
      return value.toString();
  }
};

/**
 * Get year range based on time range selection
 */
export const getYearRange = (timeRange) => {
  const currentYear = new Date().getFullYear();
  
  switch (timeRange) {
    case '5y':
      return { start: currentYear - 5, end: currentYear };
    case '10y':
      return { start: currentYear - 10, end: currentYear };
    case '20y':
      return { start: currentYear - 20, end: currentYear };
    case '50y':
      return { start: currentYear - 50, end: currentYear };
    case 'max':
      return { start: 1960, end: currentYear };
    default:
      return { start: currentYear - 10, end: currentYear };
  }
};

export default {
  INDICATORS,
  fetchIndicatorData,
  fetchMultipleIndicators,
  fetchCountryComparison,
  calculateStats,
  formatValue,
  getYearRange,
};
