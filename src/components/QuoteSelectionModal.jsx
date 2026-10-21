import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

const QuoteSelectionModal = ({ onClose, onSelectQuote }) => {
    const { user } = useAuth();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotes = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('user_quotes')
                    .select(`
                        id,
                        quote_text,
                        created_at,
                        article:theory_articles(title, slug)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                setQuotes(data || []);
            } catch (error) {
                console.error('Error fetching quotes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotes();
    }, [user]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-none shadow-none w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Select a Quote to Cite</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-4">
                    {loading ? (
                        <p className="text-gray-400">Loading your quotes...</p>
                    ) : quotes.length > 0 ? (
                        <div className="space-y-3">
                            {quotes.map((quote) => (
                                <div 
                                    key={quote.id} 
                                    onClick={() => onSelectQuote(quote)}
                                    className="bg-gray-800/80 p-3 rounded-none cursor-pointer hover:bg-red-600/30 border border-transparent hover:border-red-500 transition-all"
                                >
                                    <blockquote className="border-l-2 border-red-500 pl-3 italic text-gray-300 text-sm">
                                        <p>"{quote.quote_text}"</p>
                                    </blockquote>
                                    <p className="text-right text-xs text-gray-500 mt-2">- {quote.article.title}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-8">You have no saved quotes.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuoteSelectionModal;
