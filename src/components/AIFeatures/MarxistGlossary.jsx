import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader, BookOpen, Search, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function stripMarkdown(text) {
    if (!text) return '';
    return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

const TYPE_CONFIG = {
    event:        { label: 'Events',        color: '#d41f3d' },
    concept:      { label: 'Concepts',      color: '#c8860a' },
    person:       { label: 'People',        color: '#4a7fb5' },
    publication:  { label: 'Publications',  color: '#8a84b8' },
    organization: { label: 'Organizations', color: '#2d8a4e' },
    place:        { label: 'Places',        color: '#4a7fb5' },
    term:         { label: 'Terms',         color: '#7d7a6e' },
};

const TYPE_ORDER = ['event', 'concept', 'person', 'publication', 'organization', 'place', 'term'];

const MarxistGlossary = () => {
    const [glossary, setGlossary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState('all');
    const [collapsedGroups, setCollapsedGroups] = useState({});

    useEffect(() => {
        const fetchGlossary = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('glossary')
                    .select('term, type, explanation')
                    .order('term', { ascending: true });

                if (error) throw error;
                setGlossary(data || []);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching glossary:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGlossary();
    }, []);

    const filtered = useMemo(() => {
        let items = glossary;
        if (activeType !== 'all') {
            items = items.filter(i => i.type === activeType);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter(i =>
                i.term.toLowerCase().includes(q) ||
                i.explanation.toLowerCase().includes(q)
            );
        }
        return items;
    }, [glossary, activeType, search]);

    const grouped = useMemo(() => {
        const g = {};
        for (const item of filtered) {
            if (!g[item.type]) g[item.type] = [];
            g[item.type].push(item);
        }
        return g;
    }, [filtered]);

    const typeCounts = useMemo(() => {
        const c = {};
        for (const item of glossary) {
            c[item.type] = (c[item.type] || 0) + 1;
        }
        return c;
    }, [glossary]);

    const toggleGroup = (type) => {
        setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }));
    };

    if (loading) {
        return (
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-none flex items-center justify-center h-[500px]">
                <Loader className="animate-spin text-red-500" size={48} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-black/30 backdrop-blur-sm p-6 rounded-none">
                <h2 className="text-2xl text-white mb-4">Internal Wiki</h2>
                <div className="flex items-center justify-center h-[500px] border border-red-900/30 rounded">
                    <p className="text-red-400">Error loading glossary: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black/30 backdrop-blur-sm p-6 rounded-none min-h-[600px]">
            {/* Header */}
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                <BookOpen className="mr-3 text-red-500" />
                Internal Wiki
            </h2>
            <p className="text-gray-400 text-sm mb-6">
                {glossary.length} entries across {Object.keys(typeCounts).length} categories
            </p>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                    type="text"
                    placeholder="Search terms, concepts, events..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-gray-900/70 border border-red-900/30 rounded-none pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/60 transition-colors"
                />
            </div>

            {/* Type filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveType('all')}
                    className={`px-3 py-1.5 rounded-none text-sm font-medium transition-all ${
                        activeType === 'all'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800/60 text-gray-400 hover:text-white'
                    }`}
                >
                    All ({glossary.length})
                </button>
                {TYPE_ORDER.map(t => (
                    typeCounts[t] > 0 && (
                        <button
                            key={t}
                            onClick={() => setActiveType(activeType === t ? 'all' : t)}
                            className={`px-3 py-1.5 rounded-none text-sm font-medium transition-all ${
                                activeType === t
                                    ? 'text-white'
                                    : 'bg-gray-800/60 text-gray-400 hover:text-white'
                            }`}
                            style={activeType === t ? { backgroundColor: TYPE_CONFIG[t]?.color || '#d41f3d' } : {}}
                        >
                            {TYPE_CONFIG[t]?.label || t} ({typeCounts[t]})
                        </button>
                    )
                ))}
            </div>

            {/* Results */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-lg">No entries found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {TYPE_ORDER.map(type => {
                        const items = grouped[type];
                        if (!items || items.length === 0) return null;
                        const cfg = TYPE_CONFIG[type] || { label: type, color: '#7d7a6e' };
                        const isCollapsed = collapsedGroups[type];

                        return (
                            <div key={type}>
                                <button
                                    onClick={() => toggleGroup(type)}
                                    className="w-full flex items-center justify-between text-left mb-3 group"
                                >
                                    <h3 className="text-xl font-semibold flex items-center gap-2">
                                        <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{ backgroundColor: cfg.color }}
                                        />
                                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                                        <span className="text-gray-500 text-sm font-normal">({items.length})</span>
                                    </h3>
                                    {isCollapsed
                                        ? <ChevronRight className="text-gray-500" size={20} />
                                        : <ChevronDown className="text-gray-500" size={20} />
                                    }
                                </button>

                                {!isCollapsed && (
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <Link
                                                key={item.term}
                                                href={`/glossary/${encodeURIComponent(item.term)}`}
                                                className="block bg-gray-900/50 hover:bg-gray-900/80 p-4 rounded-none transition-colors border border-transparent hover:border-red-900/30"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-lg font-bold text-white truncate">{item.term}</h4>
                                                        <p className="text-gray-400 mt-1 text-sm line-clamp-2">{stripMarkdown(item.explanation)}</p>
                                                    </div>
                                                    <span
                                                        className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-1"
                                                        style={{ backgroundColor: cfg.color + '22', color: cfg.color }}
                                                    >
                                                        {type}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MarxistGlossary;