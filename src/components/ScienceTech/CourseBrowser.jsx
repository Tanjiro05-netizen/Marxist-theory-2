import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import CourseCard from './CourseCard';
import SubjectCard from './SubjectCard';
import { Search, TrendingUp, Clock, Zap, Filter } from 'lucide-react';

const CourseBrowser = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [userXP, setUserXP] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('stem_subjects')
        .select('*')
        .order('order_index');
      setSubjects(subjectsData || []);

      // Fetch courses (optionally filtered by subject)
      let coursesQuery = supabase
        .from('stem_courses')
        .select(`
          *,
          stem_subjects(name, slug, icon_name, color),
          stem_chapters(id)
        `)
        .eq('is_published', true)
        .order('order_index');

      if (selectedSubject) {
        coursesQuery = coursesQuery.eq('subject_id', selectedSubject);
      }

      const { data: coursesData } = await coursesQuery;
      setCourses(coursesData || []);

      // Fetch user progress and XP
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: xpData } = await supabase
          .from('stem_user_xp')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setUserXP(xpData);

        // Get recent progress
        const { data: progressData } = await supabase
          .from('stem_lesson_progress')
          .select(`
            *,
            stem_lessons(
              title,
              slug,
              stem_chapters(
                title,
                slug,
                stem_courses(title, slug)
              )
            )
          `)
          .eq('user_id', user.id)
          .is('completed_at', null)
          .order('started_at', { ascending: false })
          .limit(1);
        
        if (progressData && progressData.length > 0) {
          setUserProgress(progressData[0]);
        }

        // Fetch enrolled course IDs
        const { data: enrollData } = await supabase
          .from('stem_enrollments')
          .select('course_id')
          .eq('user_id', user.id);
        setEnrolledCourseIds(new Set((enrollData || []).map(e => e.course_id)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !difficultyFilter || course.difficulty === difficultyFilter;
    const isEnrolled = enrolledCourseIds.has(course.id);
    const matchesProgress = !progressFilter ||
      (progressFilter === 'enrolled' && isEnrolled) ||
      (progressFilter === 'not_started' && !isEnrolled);
    return matchesSearch && matchesDifficulty && matchesProgress;
  });

  const getSubjectCourseCount = (subjectId) => {
    return courses.filter(c => c.subject_id === subjectId).length;
  };

  return (
    <div className="space-y-8">
      {/* User Progress Section */}
      {(userXP || userProgress) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* XP Stats */}
          {userXP && (
            <div className="bg-[#10131b] from-red-900/20 to-black/40 backdrop-blur-lg rounded-none p-6 border border-red-900/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Your Progress
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{userXP.total_xp || 0}</div>
                  <div className="text-xs text-gray-400">Total XP</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{userXP.current_streak || 0}</div>
                  <div className="text-xs text-gray-400">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{userXP.longest_streak || 0}</div>
                  <div className="text-xs text-gray-400">Best Streak</div>
                </div>
              </div>
            </div>
          )}

          {/* Continue Learning */}
          {userProgress && userProgress.stem_lessons && (
            <div className="bg-black/40 backdrop-blur-lg rounded-none p-6 border border-red-900/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Continue Learning
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  {userProgress.stem_lessons.stem_chapters?.stem_courses?.title}
                </p>
                <p className="text-white font-medium">
                  {userProgress.stem_lessons.stem_chapters?.title} → {userProgress.stem_lessons.title}
                </p>
                <Link href={`/science-tech/courses/${userProgress.stem_lessons.stem_chapters?.stem_courses?.slug}/${userProgress.stem_lessons.stem_chapters?.slug}/${userProgress.stem_lessons.slug}`}
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-sm font-medium transition-colors"
                >
                  Resume <TrendingUp className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subject Cards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Subjects</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              courseCount={getSubjectCourseCount(subject.id)}
              isSelected={selectedSubject === subject.id}
              onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
            />
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-red-900/30 text-white rounded-none pl-10 pr-4 py-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="bg-black/50 border border-red-900/30 text-white rounded-none px-4 py-3 focus:border-red-500 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value)}
          className="bg-black/50 border border-red-900/30 text-white rounded-none px-4 py-3 focus:border-red-500 focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Courses</option>
          <option value="enrolled">Enrolled</option>
          <option value="not_started">Not Started</option>
        </select>
      </div>

      {/* Course Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {selectedSubject 
              ? `${subjects.find(s => s.id === selectedSubject)?.name} Courses`
              : 'All Courses'
            }
          </h2>
          <span className="text-gray-400 text-sm">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">No courses available yet</p>
            <p className="text-gray-500 text-sm">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} isEnrolled={enrolledCourseIds.has(course.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseBrowser;
