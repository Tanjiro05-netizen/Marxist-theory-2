import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';
import { Search, ChevronRight, BookOpen, ExternalLink, Newspaper } from 'lucide-react';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeCategory, searchQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('sci_tech_categories')
        .select('*');
      setCategories(categoriesData || []);

      // Fetch articles
      let query = supabase
        .from('sci_tech_articles')
        .select('*, sci_tech_categories(name)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (activeCategory !== 'all') {
        query = query.eq('category_id', activeCategory);
      }

      const { data: articlesData } = await query;
      setArticles(articlesData || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Science & Technology News</h2>
        <p className="text-gray-400 text-sm mt-1">
          Stay updated with the latest scientific discoveries and technological advancements
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-none text-sm transition-colors ${
            activeCategory === 'all'
              ? 'bg-red-600 text-white'
              : 'bg-black/30 text-gray-400 hover:bg-black/50'
          }`}
        >
          All News
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1.5 rounded-none text-sm transition-colors ${
              activeCategory === category.id
                ? 'bg-red-600 text-white'
                : 'bg-black/30 text-gray-400 hover:bg-black/50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search news articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/50 border border-red-900/30 text-white rounded-none pl-10 pr-4 py-3 focus:border-red-500 transition-colors"
        />
      </div>

      {/* News Grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Loading news...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">No news articles yet</p>
          <p className="text-gray-500 text-sm">Check back soon for the latest updates!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-black/40 backdrop-blur-lg rounded-none p-6 border border-red-900/30 hover:border-red-500/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-red-500 text-sm">
                  {article.sci_tech_categories?.name || 'General'}
                </span>
                <span className="text-gray-600 text-xs">
                  {article.created_at && new Date(article.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">{article.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
              <Link href={`/science-tech/news/${article.id}`}
                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
              >
                Read more <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
