import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, Tag } from 'lucide-react';
import { Pack } from '@visx/hierarchy';
import { hierarchy } from '@visx/hierarchy';
import { scaleOrdinal } from '@visx/scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { sanitizeRichHtml } from '../lib/sanitize-html.js';

const ArticleAnalysis = ({ articleId, articleContent, onJumpToText }) => {
    const [keywords, setKeywords] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [concordance, setConcordance] = useState({ word: '', sentences: [] });
    const [namedEntities, setNamedEntities] = useState([]);
    const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
    const [isLoadingConcordance, setIsLoadingConcordance] = useState(false);
    const [isLoadingNER, setIsLoadingNER] = useState(false);
    const [error, setError] = useState('');
    const [hoveredBubble, setHoveredBubble] = useState(null);

    // Fetch keywords when the component mounts or articleId changes
    useEffect(() => {
        const fetchKeywords = async () => {
            if (!articleId) return;
            setIsLoadingKeywords(true);
            setError('');
            setKeywords([]);
            setSelectedWord(null);
            setConcordance({ word: '', sentences: [] });

            try {
                const { data, error } = await supabase.functions.invoke('text-analysis', {
                    body: { article_id: articleId, mode: 'keywords' },
                });
                if (error) throw new Error(error.message);
                setKeywords(data || []);
            } catch (err) {
                console.error('Error fetching keywords:', err);
                setError('Failed to load keyword analysis.');
            } finally {
                setIsLoadingKeywords(false);
            }
        };
        fetchKeywords();

        const fetchNamedEntities = async () => {
            if (!articleContent) return;
            setIsLoadingNER(true);
            try {
                const response = await fetch('http://localhost:5001/ner', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: articleContent }),
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch named entities');
                }
                const data = await response.json();
                setNamedEntities(data);
            } catch (err) {
                console.error('Error fetching named entities:', err);
                setError('Failed to load Named-Entity Recognition analysis.');
            } finally {
                setIsLoadingNER(false);
            }
        };

        fetchNamedEntities();
    }, [articleId, articleContent]);

    // Fetch concordance when a word is selected
    useEffect(() => {
        const fetchConcordance = async () => {
            if (!selectedWord || !articleId) return;

            setIsLoadingConcordance(true);
            setError('');
            try {
                const { data, error } = await supabase.functions.invoke('text-analysis', {
                    body: { article_id: articleId, mode: 'concordance', keyword: selectedWord },
                });
                if (error) throw new Error(error.message);
                setConcordance({ word: selectedWord, sentences: data || [] });
            } catch (err) {
                console.error('Error fetching concordance:', err);
                setError(`Failed to load concordance for "${selectedWord}".`);
            } finally {
                setIsLoadingConcordance(false);
            }
        };
        fetchConcordance();
    }, [selectedWord, articleId]);

    const colorScale = useMemo(() => scaleOrdinal({
        domain: keywords.map(k => k.text),
        range: schemeCategory10,
    }), [keywords]);

    const packData = useMemo(() => {
        if (keywords.length === 0) return null;
        const root = hierarchy({
            name: 'root',
            children: keywords,
        }).sum(d => d.value);
        return root;
    }, [keywords]);

    const groupedEntities = useMemo(() => {
        return namedEntities.reduce((acc, entity) => {
            const { label } = entity;
            if (!acc[label]) {
                acc[label] = [];
            }
            acc[label].push(entity);
            return acc;
        }, {});
    }, [namedEntities]);

    return (
        <div className="p-4 bg-gray-900/50 rounded-none text-white">
            <h3 className="text-xl font-bold mb-4 text-red-400">Textual Analysis</h3>
            {error && <p className="text-red-500 bg-red-900/50 p-3 rounded-none mb-4">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Bubble Chart */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Keyword Graph</h4>
                    <p className="text-sm text-gray-400 mb-4">Most frequent words. Bubble size indicates frequency. Click a bubble to see its context.</p>
                    <div className="bg-black/20 rounded-none p-2 h-[400px] w-full relative">
                        {isLoadingKeywords ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>
                        ) : packData ? (
                            <svg width="100%" height="100%">
                                <Pack root={packData} size={[500, 400]} padding={5}>
                                    {pack => (
                                        <g>
                                            {pack.descendants().slice(1).map((circle, i) => (
                                                <g
                                                   key={`circle-${i}`}
                                                   transform={`translate(${circle.x}, ${circle.y}) scale(${hoveredBubble === i ? 1.05 : 1})`}
                                                   className="cursor-pointer transition-transform duration-300"
                                                   onClick={() => setSelectedWord(circle.data.text)}
                                                   onMouseEnter={() => setHoveredBubble(i)}
                                                   onMouseLeave={() => setHoveredBubble(null)}>

                                                    <circle
                                                        r={circle.r}
                                                        fill={colorScale(circle.data.text)}
                                                        stroke={selectedWord === circle.data.text ? '#d41f3d' : '#fff'}
                                                        strokeWidth={selectedWord === circle.data.text ? 3 : 1}
                                                        fillOpacity={0.8}
                                                    />
                                                    <text
                                                        dy=".3em"
                                                        textAnchor="middle"
                                                        fontSize={`${Math.max(8, circle.r / 3)}px`}
                                                        fill="white"
                                                        className="pointer-events-none font-sans"
                                                    >
                                                        {circle.data.text}
                                                    </text>
                                                </g>
                                            ))}
                                        </g>
                                    )}
                                </Pack>
                            </svg>
                        ) : (
                            <div className="flex justify-center items-center h-full"><p>No keywords to display.</p></div>
                        )}
                    </div>
                </div>

                {/* Right Column: Concordance */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Concordance (Keywords in Context)</h4>
                    <div className="bg-black/20 p-4 rounded-none h-[400px]">
                        {isLoadingConcordance ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>
                        ) : selectedWord ? (
                            <div>
                                <p className="text-sm text-gray-400 mb-4">Showing sentences containing "<span className='font-bold text-red-400'>{concordance.word}</span>".</p>
                                <ul className="space-y-3 pl-4 list-disc list-inside max-h-[320px] overflow-y-auto pr-2">
                                    {concordance.sentences.length > 0 ? (
                                        concordance.sentences.map((sentence, i) => (
                                            <li 
                                                key={i} 
                                                className="text-gray-300 cursor-pointer hover:bg-gray-800/50 p-1 rounded-none transition-colors"
                                                onClick={() => onJumpToText && onJumpToText(sentence)}
                                                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(sentence).replace(
                                                    new RegExp(`\\b(${`${concordance.word || ''}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi'),
                                                    '<strong class="text-red-400 font-bold">$1</strong>'
                                                ) }}>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-400">No context sentences found for this word.</p>
                                    )}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-full">
                                <p className="text-gray-400">Click a word in the graph to see its usage in context.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Named-Entity Recognition Section */}
            <div className="mt-8">
                <h4 className="text-lg font-semibold mb-2">Named-Entity Recognition</h4>
                <p className="text-sm text-gray-400 mb-4">Identified people, organizations, places, and other entities.</p>
                <div className="bg-black/20 rounded-none p-4 min-h-[200px]">
                    {isLoadingNER ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>
                    ) : Object.keys(groupedEntities).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(groupedEntities).map(([label, entities]) => (
                                <div key={label}>
                                    <h5 className="font-bold text-red-400 mb-2">{label}</h5>
                                    <ul className="space-y-1">
                                        {entities.map((entity, index) => (
                                            <li key={index} className="flex items-center text-gray-300">
                                                <Tag size={14} className="mr-2 text-gray-500" />
                                                {entity.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-full"><p>No named entities found.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArticleAnalysis;
