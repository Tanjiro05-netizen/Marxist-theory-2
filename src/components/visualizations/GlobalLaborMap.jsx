import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { motion } from 'framer-motion';

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const GlobalLaborMap = ({ strikes, movements }) => {
  // State for tracking hover and selection
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Handle geography hover
  const handleGeographyHover = (geo) => {
    const { NAME } = geo.properties;
    
    // Find all events in this country
    const countryStrikes = strikes.filter(s => s.country === NAME);
    const countryMovements = movements.filter(m => m.country === NAME);
    
    if (countryStrikes.length > 0 || countryMovements.length > 0) {
      setTooltipContent({
        name: NAME,
        strikes: countryStrikes.length,
        movements: countryMovements.length,
      });
    } else {
      setTooltipContent(null);
    }
  };
  
  // Handle marker click
  const handleMarkerClick = (event) => {
    setSelectedEvent(event.id === selectedEvent?.id ? null : event);
  };
  
  // Handle mouse movement
  const handleMouseMove = (e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <motion.div 
      className="bg-[#10131b] from-slate-900/80 via-gray-900/70 to-black/60 p-6 rounded-none shadow-none backdrop-blur-sm transition-all duration-300 hover:shadow-none border border-slate-800 hover:border-slate-700 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.005 }}
      onMouseMove={handleMouseMove}
    >
      <h3 className="text-xl font-bold text-white mb-4">Global Labor Movements & Strikes</h3>
      
      <div className="mb-3 flex space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm text-gray-300">Strikes</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm text-gray-300">Labor Movements</span>
        </div>
      </div>
      
      <ComposableMap className="bg-slate-950 rounded-none">
        <ZoomableGroup zoom={1.2} center={[0, 0]}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => {
                // Check if the country has any labor events
                const { NAME } = geo.properties;
                const hasEvents = 
                  strikes.some(s => s.country === NAME) ||
                  movements.some(m => m.country === NAME);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={hasEvents ? "#1a3658" : "#10131b"}
                    stroke="#262a35"
                    strokeWidth={0.5}
                    onMouseEnter={() => handleGeographyHover(geo.properties)}
                    onMouseLeave={() => setTooltipContent(null)}
                    style={{
                      default: { outline: 'none' },
                      hover: { 
                        fill: hasEvents ? "#234876" : "#262a35", 
                        outline: 'none',
                        transition: 'all 250ms' 
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
          
          {/* Strike Markers */}
          {strikes.map(strike => (
            <motion.g key={strike.id}>
              <Marker 
                coordinates={[strike.longitude, strike.latitude]}
                onClick={() => handleMarkerClick(strike)}
              >
                <motion.circle
                  r={strike.intensity * 3 + 4}
                  fill="#d41f3d"
                  fillOpacity={0.7}
                  stroke="#d41f3d"
                  strokeWidth={1}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: selectedEvent?.id === strike.id ? 1.3 : 1,
                    fillOpacity: selectedEvent?.id === strike.id ? 0.9 : 0.7
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                />
              </Marker>
            </motion.g>
          ))}
          
          {/* Movement Markers */}
          {movements.map(movement => (
            <motion.g key={movement.id}>
              <Marker 
                coordinates={[movement.longitude, movement.latitude]}
                onClick={() => handleMarkerClick(movement)}
              >
                <motion.circle
                  r={movement.size * 2 + 4}
                  fill="#4a7fb5"
                  fillOpacity={0.7}
                  stroke="#4a7fb5"
                  strokeWidth={1}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: selectedEvent?.id === movement.id ? 1.3 : 1,
                    fillOpacity: selectedEvent?.id === movement.id ? 0.9 : 0.7
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                />
              </Marker>
            </motion.g>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Selected Event Information */}
      {selectedEvent && (
        <motion.div 
          className="mt-4 p-4 bg-slate-800/70 rounded-none border border-slate-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-white font-semibold">{selectedEvent.name}</h4>
              <p className="text-sm text-gray-300">{selectedEvent.country}, {selectedEvent.year}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${
              selectedEvent.type === 'strike' 
                ? 'bg-red-900/60 text-red-200' 
                : 'bg-blue-900/60 text-blue-200'
            }`}>
              {selectedEvent.type === 'strike' ? 'Strike' : 'Movement'}
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{selectedEvent.description}</p>
          {selectedEvent.participants && (
            <p className="text-xs text-gray-500 mt-2">
              Participants: {selectedEvent.participants.toLocaleString()}
            </p>
          )}
        </motion.div>
      )}
      
      {/* Floating Tooltip */}
      {tooltipContent && !selectedEvent && (
        <div 
          className="fixed bg-slate-900 p-3 rounded-none shadow-none border border-slate-700 z-50 text-sm text-white pointer-events-none"
          style={{
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 40,
            maxWidth: '200px',
          }}
        >
          <p className="font-semibold">{tooltipContent.name}</p>
          {tooltipContent.strikes > 0 && (
            <p className="text-red-400">{tooltipContent.strikes} strikes</p>
          )}
          {tooltipContent.movements > 0 && (
            <p className="text-blue-400">{tooltipContent.movements} movements</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default GlobalLaborMap;
