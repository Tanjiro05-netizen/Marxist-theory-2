import React from 'react';
import Link from 'next/link';
import { Clock, BookOpen, BarChart2, ChevronRight, CheckCircle } from 'lucide-react';

const difficultyColors = {
  beginner: 'text-green-400 bg-green-400/10',
  intermediate: 'text-yellow-400 bg-yellow-400/10',
  advanced: 'text-red-400 bg-red-400/10',
};

const CourseCard = ({ course, isEnrolled }) => {
  const chapterCount = course.stem_chapters?.length || 0;
  
  return (
    <Link href={`/science-tech/courses/${course.slug}`}
      className="group bg-black/40 backdrop-blur-lg rounded-xl overflow-hidden border border-red-900/30 hover:border-red-500/50 transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${course.stem_subjects?.color || '#ef4444'}20, transparent)` 
            }}
          >
            <BookOpen className="w-12 h-12 text-gray-600" />
          </div>
        )}
        
        {/* Difficulty Badge */}
        {course.difficulty && (
          <span className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium capitalize ${difficultyColors[course.difficulty]}`}>
            {course.difficulty}
          </span>
        )}
        
        {/* Subject Badge */}
        {course.stem_subjects && (
          <span 
            className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: `${course.stem_subjects.color}90` }}
          >
            {course.stem_subjects.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {chapterCount} chapter{chapterCount !== 1 ? 's' : ''}
          </span>
          {course.estimated_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              ~{course.estimated_hours}h
            </span>
          )}
        </div>

        {/* What You'll Learn Preview */}
        {course.what_youll_learn && course.what_youll_learn.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">You'll learn:</p>
            <ul className="space-y-1">
              {course.what_youll_learn.slice(0, 2).map((item, idx) => (
                <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-red-400 text-sm font-medium group-hover:text-red-300 transition-colors flex items-center gap-1">
            {isEnrolled ? 'Continue' : 'Start Learning'} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
          {isEnrolled && (
            <span className="flex items-center gap-1 text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" /> Enrolled
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
