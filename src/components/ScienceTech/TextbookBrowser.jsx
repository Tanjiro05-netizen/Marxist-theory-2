import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import { Book, Download, Search, FileText, User } from 'lucide-react';

const TextbookBrowser = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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

      // Fetch textbooks
      let query = supabase
        .from('stem_textbooks')
        .select('*, stem_subjects(name, color)')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject);
      }

      const { data: textbooksData } = await query;
      setTextbooks(textbooksData || []);
    } catch (error) {
      console.error('Error fetching textbooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTextbooks = textbooks.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Textbook Library</h2>
          <p className="text-gray-400 text-sm mt-1">
            Reference materials and textbooks for deeper study
          </p>
        </div>
        
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search textbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-red-900/30 text-white rounded-none pl-9 pr-4 py-2 text-sm focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Subject Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSubject(null)}
          className={`px-3 py-1.5 rounded-none text-sm transition-colors ${
            !selectedSubject 
              ? 'bg-red-600 text-white' 
              : 'bg-black/30 text-gray-400 hover:bg-black/50'
          }`}
        >
          All Subjects
        </button>
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelectedSubject(subject.id)}
            className={`px-3 py-1.5 rounded-none text-sm transition-colors ${
              selectedSubject === subject.id
                ? 'bg-red-600 text-white'
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            {subject.name}
          </button>
        ))}
      </div>

      {/* Textbook Grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading textbooks...</div>
      ) : filteredTextbooks.length === 0 ? (
        <div className="text-center py-12">
          <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No textbooks available yet</p>
          <p className="text-gray-500 text-sm">Check back soon for reference materials!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTextbooks.map((book) => (
            <Link
              key={book.id}
              href={`/science-tech/textbooks/${book.id}`}
              className="group bg-black/40 backdrop-blur-lg rounded-none overflow-hidden border border-red-900/30 hover:border-red-500/50 transition-all duration-300"
            >
              {/* Cover */}
              <div className="aspect-[3/4] bg-[#10131b] from-gray-800 to-gray-900 relative">
                {book.cover_url ? (
                  <img 
                    src={book.cover_url} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                
                {/* Subject Badge */}
                {book.stem_subjects && (
                  <span 
                    className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: `${book.stem_subjects.color}90` }}
                  >
                    {book.stem_subjects.name}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-gray-500 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {book.author}
                  </p>
                )}
                {book.page_count && (
                  <p className="text-gray-600 text-xs mt-1">
                    {book.page_count} pages
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextbookBrowser;
