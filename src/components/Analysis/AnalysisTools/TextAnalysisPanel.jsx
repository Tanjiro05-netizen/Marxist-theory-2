import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, BarChart3, Search, Hash, TrendingUp, Quote, X } from 'lucide-react';
import { sanitizeRichHtml } from '../../../lib/sanitize-html.js';

const TextAnalysisPanel = ({ text, currentLanguage, selectedText = '' }) => {
    const [keywords, setKeywords] = useState([]);
    const [selectedWord, setSelectedWord] = useState(null);
    const [concordance, setConcordance] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState(selectedText ? 'selection' : 'keywords');
    const [selectionAnalysis, setSelectionAnalysis] = useState(null);

    // Update tab when selectedText changes
    useEffect(() => {
        if (selectedText) {
            setActiveTab('selection');
            analyzeSelection(selectedText);
        }
    }, [selectedText]);

    const analyzeSelection = (text) => {
        const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
        const wordFreq = {};
        words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
        
        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        setSelectionAnalysis({
            text,
            wordCount: words.length,
            charCount: text.length,
            sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length,
            topWords,
        });
    };

    // Extract all text content from sections
    const fullText = useMemo(() => {
        if (!text?.sections) return '';
        
        return text.sections.map(section => {
            const content = section.content?.[currentLanguage] || section.content?.en || section.content || '';
            // Strip HTML tags for analysis
            return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }).join(' ');
    }, [text, currentLanguage]);

    // Analyze text for keywords
    useEffect(() => {
        if (!fullText) return;
        
        setIsAnalyzing(true);
        
        // Simple keyword extraction (word frequency)
        const words = fullText
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);

        // Stop words to filter out
        const stopWords = new Set([
            'the', 'and', 'that', 'this', 'with', 'from', 'have', 'been', 'were', 'they',
            'their', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'would',
            'could', 'should', 'will', 'shall', 'must', 'into', 'upon', 'about', 'over',
            'under', 'again', 'there', 'here', 'some', 'such', 'more', 'most', 'other',
            'than', 'then', 'only', 'just', 'also', 'very', 'well', 'even', 'back',
            'being', 'those', 'these', 'after', 'before', 'between', 'through', 'during',
            'ohne', 'oder', 'aber', 'wenn', 'weil', 'dass', 'eine', 'einer', 'einem',
            'einen', 'nicht', 'sich', 'auch', 'noch', 'kann', 'wird', 'sind', 'haben',
        ]);

        const wordFreq = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        // Sort by frequency and take top 30
        const sortedKeywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([word, count]) => ({ word, count }));

        setKeywords(sortedKeywords);
        setIsAnalyzing(false);
    }, [fullText]);

    // Generate concordance for selected word
    const generateConcordance = useCallback((word) => {
        if (!fullText || !word) {
            setConcordance([]);
            return;
        }

        setSelectedWord(word);
        
        // Find sentences containing the word
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        
        const matches = sentences
            .filter(sentence => regex.test(sentence))
            .slice(0, 15)
            .map(sentence => {
                const trimmed = sentence.trim();
                // Highlight the word in the sentence
                return trimmed.replace(regex, `<mark class="bg-red-500/30 text-red-300 px-1 rounded">$&</mark>`);
            });

        setConcordance(matches);
    }, [fullText]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!fullText) return { words: 0, sentences: 0, avgWordLength: 0 };
        
        const words = fullText.split(/\s+/).filter(w => w.length > 0);
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
        const avgWordLength = words.length > 0 
            ? (words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(1)
            : 0;

        return {
            words: words.length,
            sentences: sentences.length,
            avgWordLength,
            uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
        };
    }, [fullText]);

    const maxCount = keywords.length > 0 ? keywords[0].count : 1;

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-800/50 rounded-none p-1">
                {selectionAnalysis && (
                    <button
                        onClick={() => setActiveTab('selection')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors
                            ${activeTab === 'selection' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Selection
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('keywords')}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors
                        ${activeTab === 'keywords' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Keywords
                </button>
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors
                        ${activeTab === 'stats' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Statistics
                </button>
            </div>

            {/* Selection Analysis */}
            {activeTab === 'selection' && selectionAnalysis && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white flex items-center gap-2">
                            <Quote size={16} className="text-purple-500" />
                            Selection Analysis
                        </h4>
                        <button
                            onClick={() => { setSelectionAnalysis(null); setActiveTab('keywords'); }}
                            className="text-gray-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-3 bg-gray-800/50 rounded-none max-h-24 overflow-y-auto">
                        <p className="text-sm text-gray-300 italic">
                            "{selectionAnalysis.text.length > 200 
                                ? selectionAnalysis.text.slice(0, 200) + '...' 
                                : selectionAnalysis.text}"
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-800/50 rounded-none p-2 text-center">
                            <div className="text-lg font-bold text-white">{selectionAnalysis.wordCount}</div>
                            <div className="text-xs text-gray-500">Words</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-none p-2 text-center">
                            <div className="text-lg font-bold text-white">{selectionAnalysis.charCount}</div>
                            <div className="text-xs text-gray-500">Characters</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-none p-2 text-center">
                            <div className="text-lg font-bold text-white">{selectionAnalysis.sentenceCount}</div>
                            <div className="text-xs text-gray-500">Sentences</div>
                        </div>
                    </div>

                    {selectionAnalysis.topWords.length > 0 && (
                        <div>
                            <h5 className="text-xs text-gray-400 mb-2">Top words in selection</h5>
                            <div className="flex flex-wrap gap-1">
                                {selectionAnalysis.topWords.map(({ word, count }) => (
                                    <span 
                                        key={word}
                                        className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs"
                                    >
                                        {word} ({count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'keywords' && (
                <div className="space-y-4">
                    <h4 className="font-medium text-white flex items-center gap-2">
                        <Hash size={16} className="text-red-500" />
                        Top Keywords
                    </h4>

                    {isAnalyzing ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                        </div>
                    ) : keywords.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No keywords found</p>
                    ) : (
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
                            {keywords.slice(0, 15).map(({ word, count }) => (
                                <button
                                    key={word}
                                    onClick={() => generateConcordance(word)}
                                    className={`w-full flex items-center gap-2 p-2 rounded-none transition-colors text-left
                                        ${selectedWord === word 
                                            ? 'bg-red-600/20 border border-red-500/30' 
                                            : 'bg-gray-800/50 hover:bg-gray-800'}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-white truncate block">{word}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 rounded-full"
                                                style={{ width: `${(count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Concordance */}
                    {selectedWord && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                <Search size={14} className="text-red-500" />
                                "{selectedWord}" in context
                            </h5>
                            {concordance.length === 0 ? (
                                <p className="text-gray-500 text-xs">No matches found</p>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                    {concordance.map((sentence, i) => (
                                        <p 
                                            key={i}
                                            className="text-xs text-gray-400 p-2 bg-gray-800/30 rounded"
                                            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(`...${sentence}...`) }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'stats' && (
                <div className="space-y-4">
                    <h4 className="font-medium text-white flex items-center gap-2">
                        <TrendingUp size={16} className="text-red-500" />
                        Text Statistics
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/50 rounded-none p-3">
                            <div className="text-2xl font-bold text-white">{stats.words.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Total Words</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-none p-3">
                            <div className="text-2xl font-bold text-white">{stats.sentences.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Sentences</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-none p-3">
                            <div className="text-2xl font-bold text-white">{stats.uniqueWords.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">Unique Words</div>
                        </div>
                        <div className="bg-gray-800/50 rounded-none p-3">
                            <div className="text-2xl font-bold text-white">{stats.avgWordLength}</div>
                            <div className="text-xs text-gray-500">Avg Word Length</div>
                        </div>
                    </div>

                    {/* Vocabulary Richness */}
                    <div className="bg-gray-800/50 rounded-none p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Vocabulary Richness</span>
                            <span className="text-xs text-white font-medium">
                                {stats.words > 0 ? ((stats.uniqueWords / stats.words) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-[#10131b] from-red-600 to-red-400 rounded-full"
                                style={{ width: `${stats.words > 0 ? (stats.uniqueWords / stats.words) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextAnalysisPanel;
