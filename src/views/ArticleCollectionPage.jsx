import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { supabase } from '../supabaseClient';
import * as s from './ArticleCollectionPage.css.ts';

const ArticleCollectionPage = () => {
    const { collectionType } = useParams();
    
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            setError(null);

            let query = supabase.from('theory_articles').select(`
                id, slug, title, excerpt, estimated_time_min,
                category: theory_categories (name)
            `);

            if (collectionType === 'classics') {
                query = query.eq('is_classic', true);
                setTitle('Marxist Classics');
            } else if (collectionType === 'contemporary') {
                query = query.eq('is_contemporary', true);
                setTitle('Contemporary Theory');
            } else if (collectionType === 'featured') {
                query = query.eq('is_featured', true);
                setTitle('Featured Materials');
            } else {
                setError('Invalid collection type.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: queryError } = await query;
                if (queryError) throw queryError;
                setArticles(data || []);
            } catch (err) {
                setError(err.message);
                console.error(`Error fetching ${collectionType} articles:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [collectionType]);

    return (
        <div className={s.page}>
            <main className={s.main}>
                <h1 className={s.pageTitle}>{title}</h1>

                {loading ? (
                    <p>Loading articles...</p>
                ) : error ? (
                    <p className={s.errorText}>Error: {error}</p>
                ) : articles.length > 0 ? (
                    <div className={s.grid}>
                        {articles.map(article => (
                            <Link href={`/theory/article/${article.slug}`} key={article.id} className={s.card}>
                                <div className={s.cardCategory}>
                                    {article.category?.name || 'Uncategorized'}
                                </div>
                                <h3 className={s.cardTitle}>{article.title}</h3>
                                <p className={s.cardExcerpt}>{article.excerpt}</p>
                                <span className={s.cardMeta}>{article.estimated_time_min} min read</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p>No articles found in this collection.</p>
                )}
            </main>
        </div>
    );
};

export default ArticleCollectionPage;
