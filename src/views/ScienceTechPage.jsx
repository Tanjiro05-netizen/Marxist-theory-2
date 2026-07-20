import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { fetchScienceHub, getCurrentUser, getScienceErrorMessage } from '../services/scienceApi';
import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  ChevronRight,
  Code2,
  FileText,
  FlaskConical,
  Grid,
  List,
  Microscope,
  Search,
  Settings,
  Target,
  Trophy,
} from 'lucide-react';

const subjectIcons = {
  Physics: Atom,
  Mathematics: Calculator,
  'Computer Science': Code2,
  Chemistry: FlaskConical,
  'Biology & Medicine': Microscope,
  Engineering: Brain,
};

const levelLabel = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const minutesToLabel = (minutes) => {
  if (!minutes) return 'TBD';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} hrs`;
};

const getSubjectCourseCount = (courses, subjectId) =>
  courses.filter((course) => course.subject_id === subjectId).length;

const ScienceTechPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [textbooks, setTextbooks] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [query, setQuery] = useState('');
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [hubData, currentUser] = await Promise.all([fetchScienceHub(), getCurrentUser()]);
        setSubjects(hubData.subjects);
        setTracks(hubData.tracks);
        setCourses(hubData.courses);
        setTextbooks(hubData.textbooks);
        setDemoMode(Boolean(hubData.demoMode));
        setUser(currentUser);
      } catch (loadError) {
        console.error('Error loading Science v2 hub:', loadError);
        setError(getScienceErrorMessage(loadError, 'Could not load Science & Technology.'));
        setDemoMode(false);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const enrolledCourses = useMemo(() => {
    if (!user) return [];
    return courses.filter((course) =>
      (course.science_enrollments || []).some((enrollment) => enrollment.user_id === user.id)
    );
  }, [courses, user]);

  const filteredCourses = useMemo(() => {
    const search = query.trim().toLowerCase();
    return courses.filter((course) => {
      const text = `${course.title} ${course.subtitle || ''} ${course.description || ''} ${course.science_subjects?.name || ''}`.toLowerCase();
      return (
        (!search || text.includes(search)) &&
        (selectedSubject === 'all' || course.subject_id === selectedSubject) &&
        (selectedLevel === 'all' || course.level === selectedLevel)
      );
    });
  }, [courses, query, selectedLevel, selectedSubject]);

  const groupedCourses = useMemo(() => {
    const groups = {};
    filteredCourses.forEach((course) => {
      const key = course.science_subjects?.name || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(course);
    });
    return groups;
  }, [filteredCourses]);

  const stats = useMemo(() => ({
    courses: courses.length,
    subjects: subjects.length,
    modules: courses.reduce((total, course) => total + (course.science_modules?.length || 0), 0),
    active: enrolledCourses.length,
  }), [courses, enrolledCourses.length, subjects.length]);

  return (
    <div className="min-h-screen bg-[#12131A] text-gray-200">
      <Header />
      <main className="pt-20 pb-12">
        <section className="bg-black/35 border-b border-red-900/20">
          <div className="container mx-auto max-w-7xl px-4 py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-red-500 text-sm font-semibold uppercase tracking-wide">Science & Technology</p>
                <h1 className="text-4xl md:text-5xl font-bold text-white mt-2">Course and Research Catalog</h1>
                <p className="text-gray-400 mt-4 max-w-3xl text-lg">
                  Structured courses, technical readings, practice sets, simulations, and reference materials for systematic study.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4 min-w-full lg:min-w-[460px]">
                <Stat label="Courses" value={stats.courses} />
                <Stat label="Subjects" value={stats.subjects} />
                <Stat label="Modules" value={stats.modules} />
                <Stat label="Active" value={stats.active} />
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-4 py-8">
          {error && <div className="mb-6 border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-200">{error}</div>}
          {demoMode && (
            <div className="mb-6 border border-yellow-900/50 bg-yellow-950/20 px-4 py-3 text-yellow-100">
              Local demo mode: Supabase Science v2 tables are still missing, so the Physics demo course is being rendered from the app bundle.
            </div>
          )}

          <section className="border border-gray-800 bg-black/30 p-4 mb-6">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search courses, subjects, methods, or resources"
                  className="w-full bg-black/50 border border-gray-700 text-white pl-9 pr-3 py-2.5 focus:border-red-500 focus:outline-none"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="bg-black/50 border border-gray-700 text-white px-3 py-2.5 focus:border-red-500 focus:outline-none"
              >
                <option value="all">All subjects</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
              <select
                value={selectedLevel}
                onChange={(event) => setSelectedLevel(event.target.value)}
                className="bg-black/50 border border-gray-700 text-white px-3 py-2.5 focus:border-red-500 focus:outline-none"
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="flex border border-gray-700 bg-black/50">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'text-white bg-red-950/30' : 'text-gray-500 hover:text-white'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 border-l border-gray-700 ${viewMode === 'grid' ? 'text-white bg-red-950/30' : 'text-gray-500 hover:text-white'}`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[260px_1fr_300px]">
            <aside className="space-y-4">
              <Panel title="Subjects" icon={BookOpen}>
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className={`w-full flex items-center justify-between py-2 text-sm ${selectedSubject === 'all' ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  <span>All subjects</span>
                  <span>{courses.length}</span>
                </button>
                {subjects.map((subject) => {
                  const Icon = subjectIcons[subject.name] || BookOpen;
                  const active = selectedSubject === subject.id;
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`w-full flex items-center justify-between gap-3 py-2 text-left text-sm ${active ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" style={{ color: active ? subject.color : undefined }} />
                        <span className="truncate">{subject.name}</span>
                      </span>
                      <span>{getSubjectCourseCount(courses, subject.id)}</span>
                    </button>
                  );
                })}
              </Panel>

              <Panel title="Tracks" icon={Trophy}>
                {tracks.length === 0 ? (
                  <p className="text-gray-600 text-sm">No published tracks yet.</p>
                ) : tracks.slice(0, 6).map((track) => (
                  <div key={track.id} className="border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-gray-200 text-sm font-medium">{track.title}</p>
                    <p className="text-gray-600 text-xs">{track.science_subjects?.name || track.level}</p>
                  </div>
                ))}
              </Panel>
            </aside>

            <section className="min-w-0">
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Published Courses</h2>
                  <p className="text-gray-600 text-sm">{filteredCourses.length} records visible</p>
                </div>
                <Link href="/admin/science" className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
                  <Settings className="w-4 h-4" />
                  Creator Studio
                </Link>
              </div>

              {isLoading ? (
                <div className="border border-gray-800 bg-black/30 p-8 text-center text-gray-400">Loading catalog...</div>
              ) : filteredCourses.length === 0 ? (
                <div className="border border-gray-800 bg-black/30 p-8 text-center">
                  <p className="text-gray-300 font-medium">No published v2 courses match these filters.</p>
                  <p className="text-gray-600 text-sm mt-2">Use Creator Studio to draft and publish a course.</p>
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-7">
                  {Object.entries(groupedCourses).map(([subjectName, group]) => (
                    <div key={subjectName}>
                      <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                        <h3 className="text-white font-semibold">{subjectName}</h3>
                        <span className="text-xs text-gray-600">{group.length} courses</span>
                      </div>
                      <div className="border border-gray-800 bg-black/30 overflow-hidden">
                        <div className="hidden md:grid grid-cols-[1fr_90px_90px_100px_120px_36px] gap-3 px-4 py-2 bg-black/45 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-600">
                          <span>Course</span>
                          <span>Level</span>
                          <span>Time</span>
                          <span>Modules</span>
                          <span>Status</span>
                          <span />
                        </div>
                        {group.map((course) => <CourseRow key={course.id} course={course} user={user} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCourses.map((course) => <CourseCompactCard key={course.id} course={course} user={user} />)}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <Panel title="Continue Learning" icon={Target}>
                {enrolledCourses.length === 0 ? (
                  <p className="text-gray-600 text-sm">No active enrollments yet.</p>
                ) : enrolledCourses.slice(0, 5).map((course) => {
                  const enrollment = (course.science_enrollments || []).find((item) => item.user_id === user?.id);
                  return (
                    <Link key={course.id} href={`/science-tech/courses/${course.slug}`} className="block border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                      <p className="text-gray-200 text-sm font-medium">{course.title}</p>
                      <div className="h-1.5 bg-gray-800 mt-2">
                        <div className="h-full bg-red-500" style={{ width: `${enrollment?.progress_percent || 0}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </Panel>

              <Panel title="Reference Library" icon={FileText}>
                {textbooks.length === 0 ? (
                  <p className="text-gray-600 text-sm">No published references yet.</p>
                ) : textbooks.slice(0, 5).map((book) => (
                  <Link key={book.id} href={`/science-tech/textbooks/${book.id}`} className="block border-b border-gray-800 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-gray-200 text-sm font-medium">{book.title}</p>
                    <p className="text-gray-600 text-xs">{book.stem_subjects?.name || book.author}</p>
                  </Link>
                ))}
              </Panel>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="border border-gray-800 bg-black/35 p-3">
    <p className="text-2xl font-bold text-red-500">{value}</p>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
  </div>
);

const StatusChip = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'border-gray-700 text-gray-400 bg-black/30',
    green: 'border-green-900/50 text-green-400 bg-green-950/10',
    yellow: 'border-yellow-900/50 text-yellow-400 bg-yellow-950/10',
    red: 'border-red-900/50 text-red-400 bg-red-950/10',
  };
  return <span className={`inline-flex items-center px-2 py-1 text-xs border ${tones[tone] || tones.neutral}`}>{children}</span>;
};

const CourseRow = ({ course, user }) => {
  const enrollment = (course.science_enrollments || []).find((item) => item.user_id === user?.id);
  const moduleCount = course.science_modules?.length || 0;
  return (
    <Link href={`/science-tech/courses/${course.slug}`} className="grid md:grid-cols-[1fr_90px_90px_100px_120px_36px] gap-3 px-4 py-4 border-b border-gray-800 last:border-b-0 hover:bg-red-950/10 transition-colors">
      <div className="min-w-0">
        <p className="text-white font-semibold truncate">{course.title}</p>
        <p className="text-gray-500 text-sm line-clamp-1">{course.subtitle || course.description || 'No overview yet'}</p>
        <div className="flex flex-wrap gap-2 mt-2 md:hidden">
          <StatusChip>{levelLabel[course.level] || course.level}</StatusChip>
          <StatusChip>{minutesToLabel(course.estimated_minutes)}</StatusChip>
          <StatusChip>{moduleCount} modules</StatusChip>
        </div>
      </div>
      <span className="hidden md:block text-sm text-gray-400">{levelLabel[course.level] || course.level}</span>
      <span className="hidden md:block text-sm text-gray-400">{minutesToLabel(course.estimated_minutes)}</span>
      <span className="hidden md:block text-sm text-gray-400">{moduleCount}</span>
      <div className="hidden md:flex flex-wrap gap-1">
        {course.certificate_available && <StatusChip tone="yellow">Cert</StatusChip>}
        {enrollment && <StatusChip tone="green">{enrollment.progress_percent || 0}%</StatusChip>}
      </div>
      <ChevronRight className="hidden md:block w-4 h-4 text-gray-600" />
    </Link>
  );
};

const CourseCompactCard = ({ course, user }) => {
  const enrollment = (course.science_enrollments || []).find((item) => item.user_id === user?.id);
  return (
    <Link href={`/science-tech/courses/${course.slug}`} className="border border-gray-800 bg-black/30 p-4 hover:border-red-900/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-600">{course.science_subjects?.name || 'Science'}</p>
          <h3 className="text-white font-semibold mt-1">{course.title}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>
      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{course.subtitle || course.description || 'No overview yet'}</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <StatusChip>{levelLabel[course.level] || course.level}</StatusChip>
        <StatusChip>{course.science_modules?.length || 0} modules</StatusChip>
        <StatusChip>{minutesToLabel(course.estimated_minutes)}</StatusChip>
        {course.certificate_available && <StatusChip tone="yellow">Certificate</StatusChip>}
      </div>
      {enrollment && (
        <div className="mt-4 h-1.5 bg-gray-800">
          <div className="h-full bg-red-500" style={{ width: `${enrollment.progress_percent || 0}%` }} />
        </div>
      )}
    </Link>
  );
};

const Panel = ({ title, icon: Icon, children }) => (
  <div className="border border-gray-800 bg-black/30 p-4">
    <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-red-500" />
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

export default ScienceTechPage;
