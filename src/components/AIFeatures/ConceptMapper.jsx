import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import ConceptMapPanel from '../Reader/ConceptMapPanel';
import { buildConceptGraphData, extractPassages } from '../../utils/readerInsights';

const ConceptMapper = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [articleOptions, setArticleOptions] = useState([]);
    const [glossaryTerms, setGlossaryTerms] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [{ data: articles, error: articleError }, { data: glossary, error: glossaryError }] = await Promise.all([
                    supabase
                        .from('theory_articles')
                        .select('id, slug, title, content')
                        .order('created_at', { ascending: false })
                        .limit(20),
                    supabase
                        .from('glossary')
                        .select('term, explanation')
                        .order('term', { ascending: true })
                ]);

                if (articleError) throw articleError;
                if (glossaryError) throw glossaryError;

                const options = articles || [];
                setArticleOptions(options);
                setSelectedArticle(options[0] || null);
                setGlossaryTerms(glossary || []);
            } catch (err) {
                console.error('Error loading concept map data:', err);
                setError(err.message || 'Failed to load concept map data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const graphData = useMemo(() => {
        if (!selectedArticle?.content) return { nodes: [], links: [] };
        const passages = extractPassages(selectedArticle.content);
        return buildConceptGraphData({ passages, glossaryTerms });
    }, [selectedArticle, glossaryTerms]);

    const handleNodeClick = (node) => {
        if (!selectedArticle?.slug || !node) return;
        if (node.type === 'heading' && node.passageId) {
            router.push(`/theory/article/${selectedArticle.slug}?passage=${node.passageId}`);
            return;
        }
        if (node.type === 'concept' && node.concept) {
            router.push(`/theory/article/${selectedArticle.slug}?concept=${encodeURIComponent(node.concept)}`);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-gray-800/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-2xl text-white">Concept Visualization</h2>
                    <p className="text-sm text-gray-400">Explore concept relationships and jump directly into passages.</p>
                </div>
                <select
                    className="bg-gray-900 border border-gray-700 text-sm rounded px-3 py-2 text-gray-200"
                    value={selectedArticle?.id ? String(selectedArticle.id) : ''}
                    onChange={(e) => {
                        const next = articleOptions.find((item) => String(item.id) === e.target.value);
                        setSelectedArticle(next || null);
                    }}
                >
                    {articleOptions.map((article) => (
                        <option key={article.id} value={String(article.id)}>{article.title}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="h-[420px] rounded border border-gray-800 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
                </div>
            ) : error ? (
                <div className="h-[420px] rounded border border-gray-800 flex items-center justify-center text-red-400 text-sm">
                    {error}
                </div>
            ) : (
                <ConceptMapPanel graphData={graphData} onNodeClick={handleNodeClick} />
            )}
        </div>
    );
};

export default ConceptMapper;