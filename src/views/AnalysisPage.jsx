import React, { useState, useEffect, useMemo } from 'react';
import ArticleComments from '../components/ArticleComments';
import PrivateNotes from '../components/PrivateNotes';
import ArticleAnalysis from '../components/ArticleAnalysis';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { BookText, Loader, Search, List, Grid, BookOpen } from 'lucide-react';
import * as s from './AnalysisPage.css.ts';

const AnalysisPage = () => {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [activeTab, setActiveTab] = useState('Content');
    const [scrollToText, setScrollToText] = useState(null);
    const TABS = ['Content', 'Comments', 'Notes', 'Analysis'];

    useEffect(() => {
        if (activeTab === 'Content' && scrollToText) {
            setTimeout(() => {
                const highlightElement = document.getElementById('highlighted-concordance');
                if (highlightElement) {
                    highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        setScrollToText(null);
                    }, 2500); 
                } else {
                    setScrollToText(null);
                }
            }, 100);
        }
    }, [scrollToText, activeTab]);

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!user) {
                // If no user, ensure we don't hang in loading state (though ProtectedRoute should prevent this)
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (error && error.code !== 'PGRST116') throw error;
                setUserRole(data?.role || 'user');
            } catch (err) {
                console.error('Error fetching user role:', err);
                // Fallback to 'user' role on error so fetchData can run and stop loading
                setUserRole('user');
                // Optional: keep the error if you want to notify the user, 
                // but usually we want to allow read-only access or partial functionality
                // setError('Could not verify user role.'); 
            }
        };
        fetchUserRole();
    }, [user]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const categoriesResult = await supabase.from('theory_categories').select('id, name');
                if (categoriesResult.error) throw new Error(`Categories fetch failed: ${categoriesResult.error.message}`);
                
                const articlesResult = await supabase.from('theory_articles').select('id, title, slug, category_id, description');
                if (articlesResult.error) throw new Error(`Articles fetch failed: ${articlesResult.error.message}`);

                const categoriesData = categoriesResult.data || [];
                const articlesData = articlesResult.data || [];

                const articlesWithCategories = articlesData.map(article => {
                    const category = categoriesData.find(cat => cat.id === article.category_id);
                    return {
                        ...article,
                        theory_categories: category ? { id: category.id, name: category.name } : null,
                    };
                });
                
                setArticles(articlesWithCategories);
                setCategories(categoriesData);
                setError(null);
            } catch (err) {
                console.error('Error fetching analysis data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userRole) {
            fetchData();
        }
    }, [userRole, user]);

    const handleJumpToText = (sentence) => {
        setActiveTab('Content');
        setScrollToText(sentence);
    };

    const articleContentHtml = useMemo(() => {
        if (!selectedArticle?.content) return '<p>Content not available.</p>';
        let content = selectedArticle.content;
        if (scrollToText) {
            const escapedSentence = scrollToText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(escapedSentence, 'i');
            if (content.match(regex)) {
                content = content.replace(regex, (match) => `<span id="highlighted-concordance" class="bg-yellow-500/30 transition-all duration-300 p-1 rounded">${match}</span>`);
            }
        }
        return content;
    }, [selectedArticle?.content, scrollToText]);

    const filteredArticles = useMemo(() => {
        let filtered = [...articles];
        
        if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(article => 
                article.theory_categories?.name === selectedCategory
            );
        }
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(article => 
                article.title.toLowerCase().includes(query) ||
                (article.description && article.description.toLowerCase().includes(query))
            );
        }
        
        return filtered;
    }, [articles, selectedCategory, searchQuery]);


    const handleSelectArticle = async (article) => {
        setSelectedArticle({ ...article, loadingContent: true });
        setError(null);
        try {
            const { data, error } = await supabase
                .from('theory_articles')
                .select('content')
                .eq('id', article.id)
                .single();

            if (error) throw error;

            setSelectedArticle({ ...article, content: data.content, loadingContent: false });
            setActiveTab('Content');
        } catch (err) {
            console.error('Error fetching article content:', err);
            setError('Failed to load article content.');
            setSelectedArticle(null);
        } 
    };

    const renderArticleCard = (article) => (
        <div key={article.id} className={viewMode === 'grid' ? s.card : s.cardList}>
            <div className={s.cardBody}>
                <div className={s.cardCategory}>{article.theory_categories?.name || 'Uncategorized'}</div>
                <h3 className={s.cardTitle}>{article.title}</h3>
                {article.description && <p className={s.cardDesc}>{article.description}</p>}
            </div>
            <div className={s.cardFooter}>
                <button
                    onClick={() => handleSelectArticle(article)}
                    disabled={selectedArticle?.loadingContent && selectedArticle?.id === article.id}
                    className={s.analyzeBtn}
                >
                    {selectedArticle?.loadingContent && selectedArticle?.id === article.id ? (
                        <><Loader size={16} style={{marginRight:8}} /> Loading...</>
                    ) : (
                        <><BookOpen size={16} style={{marginRight:8}} /> Analyze</>
                    )}
                </button>
            </div>
        </div>
    );

    if (loading && !articles.length) {
        return <div className={s.loadingWrap}><Loader className="animate-spin mr-2"/>Loading Analysis Page...</div>;
    }

    return (
        <div className={s.page}>
            <main className={s.main}>
                {selectedArticle && !selectedArticle.loadingContent ? (
                    <div>
                        <button onClick={() => setSelectedArticle(null)} className={s.backBtn}>
                            ← Back to Articles
                        </button>
                        <div className={s.readerCard}>
                            <h1 className={s.readerTitle}>{selectedArticle.title}</h1>
                            <p className={s.readerCategory}>{selectedArticle.theory_categories?.name || 'Uncategorized'}</p>

                            <div className={s.tabRow}>
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`${s.tabBtn} ${activeTab === tab ? s.tabBtnActive : ''}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div>
                                {activeTab === 'Content' && (
                                    <div className={s.contentPane} dangerouslySetInnerHTML={{ __html: articleContentHtml }} style={{color:'rgba(255,255,255,0.72)',lineHeight:1.8}} />
                                )}
                                {activeTab === 'Comments' && <ArticleComments articleId={selectedArticle.id} userRole={userRole} />}
                                {activeTab === 'Notes' && <PrivateNotes articleId={selectedArticle.id} />}
                                {activeTab === 'Analysis' && <ArticleAnalysis articleId={selectedArticle.id} articleContent={selectedArticle.content} onJumpToText={handleJumpToText} />}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{marginBottom:32}}>
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                                <h1 className={s.pageTitle}>
                                    <BookText size={36} className={s.pageTitleIcon} />
                                    Analysis
                                </h1>
                                <div className={s.pageCount}>{filteredArticles.length} papers available</div>
                            </div>
                        </div>

                        <div className={s.searchRow}>
                            <div className={s.searchWrap}>
                                <Search size={20} className={s.searchIcon} />
                                <input type="text" placeholder="Search articles and analyses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={s.searchInput} />
                            </div>
                            <div style={{display:'flex',gap:8}}>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={s.selectInput}>
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (<option key={category.id} value={category.name}>{category.name}</option>))}
                                </select>
                                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className={s.viewToggle}>
                                    {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className={s.filterRow}>
                            <button onClick={() => setSelectedCategory('all')} className={`${s.filterPill} ${selectedCategory === 'all' ? s.filterPillActive : ''}`}>All</button>
                            {categories.map(category => (
                                <button key={category.id} onClick={() => setSelectedCategory(category.name)} className={`${s.filterPill} ${selectedCategory === category.name ? s.filterPillActive : ''}`}>{category.name}</button>
                            ))}
                        </div>

                        {error && <p className={s.errorBox}>{error}</p>}

                        <div className={viewMode === 'grid' ? s.gridView : s.listView}>
                            {filteredArticles.map(article => renderArticleCard(article))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AnalysisPage;