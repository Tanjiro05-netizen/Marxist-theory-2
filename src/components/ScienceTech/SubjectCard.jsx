import React from 'react';
import { Atom, FlaskConical, Calculator, Code, Heart } from 'lucide-react';

const iconMap = {
  'Atom': Atom,
  'FlaskConical': FlaskConical,
  'Calculator': Calculator,
  'Code': Code,
  'Heart': Heart,
};

const SubjectCard = ({ subject, courseCount, isSelected, onClick }) => {
  const IconComponent = iconMap[subject.icon_name] || Atom;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-none border transition-all duration-300 text-left
        ${isSelected 
          ? 'bg-red-900/30 border-red-500/50 scale-105' 
          : 'bg-black/40 border-red-900/30 hover:border-red-500/30 hover:scale-102'
        }
      `}
      style={{
        '--subject-color': subject.color || '#d41f3d'
      }}
    >
      <div 
        className="w-10 h-10 rounded-none flex items-center justify-center mb-3"
        style={{ backgroundColor: `${subject.color}20` }}
      >
        <IconComponent 
          className="w-5 h-5" 
          style={{ color: subject.color || '#d41f3d' }}
        />
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{subject.name}</h3>
      <p className="text-gray-500 text-xs">
        {courseCount} course{courseCount !== 1 ? 's' : ''}
      </p>
      
      {isSelected && (
        <div 
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: subject.color || '#d41f3d' }}
        />
      )}
    </button>
  );
};

export default SubjectCard;
