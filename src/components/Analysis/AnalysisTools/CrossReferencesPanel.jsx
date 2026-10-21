import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { Link2, ArrowRight, ArrowLeft, Plus, Trash2, Search, Loader2, ExternalLink } from 'lucide-react';

const CrossReferencesPanel = ({ 
    textId,
    outgoingRefs, 
    incomingRefs, 
    loading, 
    onCreateReference, 
    onDeleteReference,
    currentSectionId,
}) => {
    const router = useRouter();
    const { user } = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [targetSectionId, setTargetSectionId] = useState('');
    const [note, setNote] = useState('');
    const [creating, setCreating] = useState(false);

    // Search for texts to reference
    useEffect(() => {
        const searchTexts = async () => {
            if (!searchQuery.trim() || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setSearching(true);
            try {
                const { data, error } = await supabase
                    .from('analysis_texts')
                    .select('id, slug, metadata, primary_language')
                    .eq('is_published', true)
                    .neq('id', textId)
                    .limit(10);

                if (error) throw error;

                // Filter by search query (client-side for metadata search)
                const filtered = data?.filter(text => {
                    const meta = text.metadata?.[text.primary_language] || text.metadata?.en || {};
                    const title = meta.title?.toLowerCase() || '';
                    return title.includes(searchQuery.toLowerCase());
                }) || [];

                setSearchResults(filtered);
            } catch (err) {
                console.error('Error searching texts:', err);
            } finally {
                setSearching(false);
            }
        };

        const debounce = setTimeout(searchTexts, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, textId]);

    const handleCreate = async () => {
        if (!selectedTarget || !currentSectionId) return;

        setCreating(true);
        const result = await onCreateReference(
            currentSectionId,
            selectedTarget.id,
            targetSectionId || null,
            note || null
        );
        setCreating(false);

        if (!result.error) {
            setShowCreateForm(false);
            setSearchQuery('');
            setSelectedTarget(null);
            setTargetSectionId('');
            setNote('');
        }
    };

    const getTitle = (text) => {
        const meta = text?.metadata?.[text?.primary_language] || text?.metadata?.en || {};
        return meta.title || 'Untitled';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-white flex items-center gap-2">
                    <Link2 size={16} className="text-red-500" />
                    Cross-References
                </h4>
                {user && currentSectionId && (
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-gray-800/50 rounded-none p-3 space-y-3">
                    <p className="text-xs text-gray-400">
                        Create reference from §{currentSectionId}
                    </p>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search texts..."
                            className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Search Results */}
                    {searching ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {searchResults.map(text => (
                                <button
                                    key={text.id}
                                    onClick={() => setSelectedTarget(text)}
                                    className={`w-full text-left p-2 rounded text-sm transition-colors
                                        ${selectedTarget?.id === text.id 
                                            ? 'bg-red-600/20 text-white' 
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                                >
                                    {getTitle(text)}
                                </button>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No texts found</p>
                    ) : null}

                    {/* Selected Target */}
                    {selectedTarget && (
                        <div className="space-y-2">
                            <div className="text-xs text-gray-400">
                                Selected: <span className="text-white">{getTitle(selectedTarget)}</span>
                            </div>
                            <input
                                type="text"
                                value={targetSectionId}
                                onChange={(e) => setTargetSectionId(e.target.value)}
                                placeholder="Target section ID (optional)"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
                            />
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
                            />
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded text-sm font-medium transition-colors"
                            >
                                {creating ? 'Creating...' : 'Create Reference'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Outgoing References */}
                    <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                            <ArrowRight size={12} />
                            References to other texts ({outgoingRefs.length})
                        </h5>
                        {outgoingRefs.length === 0 ? (
                            <p className="text-xs text-gray-500 py-2">No outgoing references</p>
                        ) : (
                            <div className="space-y-2">
                                {outgoingRefs.map(ref => (
                                    <div 
                                        key={ref.id}
                                        className="bg-gray-800/50 rounded p-2 group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <button
                                                    onClick={() => router.push(`/analysis/text/${ref.target?.slug}`)}
                                                    className="text-sm text-white hover:text-red-400 truncate block"
                                                >
                                                    {getTitle(ref.target)}
                                                    <ExternalLink size={12} className="inline ml-1" />
                                                </button>
                                                <div className="text-xs text-gray-500">
                                                    §{ref.source_section_id} → {ref.target_section_id ? `§${ref.target_section_id}` : 'whole text'}
                                                </div>
                                                {ref.note && (
                                                    <p className="text-xs text-gray-400 mt-1">{ref.note}</p>
                                                )}
                                            </div>
                                            {user?.id === ref.created_by && (
                                                <button
                                                    onClick={() => onDeleteReference(ref.id)}
                                                    className="p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Incoming References */}
                    <div>
                        <h5 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                            <ArrowLeft size={12} />
                            References from other texts ({incomingRefs.length})
                        </h5>
                        {incomingRefs.length === 0 ? (
                            <p className="text-xs text-gray-500 py-2">No incoming references</p>
                        ) : (
                            <div className="space-y-2">
                                {incomingRefs.map(ref => (
                                    <div 
                                        key={ref.id}
                                        className="bg-gray-800/50 rounded p-2"
                                    >
                                        <button
                                            onClick={() => router.push(`/analysis/text/${ref.source?.slug}`)}
                                            className="text-sm text-white hover:text-red-400 truncate block"
                                        >
                                            {getTitle(ref.source)}
                                            <ExternalLink size={12} className="inline ml-1" />
                                        </button>
                                        <div className="text-xs text-gray-500">
                                            §{ref.source_section_id} → {ref.target_section_id ? `§${ref.target_section_id}` : 'this text'}
                                        </div>
                                        {ref.note && (
                                            <p className="text-xs text-gray-400 mt-1">{ref.note}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrossReferencesPanel;
