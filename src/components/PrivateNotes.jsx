import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Loader, ShieldCheck, AlertTriangle } from 'lucide-react';

// Debounce hook to delay function execution
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const PrivateNotes = ({ articleId }) => {
    const { user } = useAuth();
    const [note, setNote] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, typing, saving, saved, error
    const [error, setError] = useState(null);

    const debouncedNote = useDebounce(note, 1500); // 1.5 second debounce delay

    // Fetch existing note on component mount
    useEffect(() => {
        const fetchNote = async () => {
            if (!user || !articleId) return;
            setStatus('loading');
            try {
                const { data, error } = await supabase
                    .from('theory_article_analysis_notes')
                    .select('content')
                    .eq('user_id', user.id)
                    .eq('article_id', articleId)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found'
                    throw error;
                }
                
                if (data) {
                    setNote(data.content);
                }
                setStatus('idle');
            } catch (err) {
                console.error('Error fetching note:', err);
                setError('Failed to load note.');
                setStatus('error');
            }
        };

        fetchNote();
    }, [user, articleId]);

    // Save note to Supabase (debounced)
    const saveNote = useCallback(async (content) => {
        if (!user || !articleId) return;
        setStatus('saving');
        try {
            const { error } = await supabase
                .from('theory_article_analysis_notes')
                .upsert({
                    user_id: user.id,
                    article_id: articleId,
                    content: content,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id, article_id' });

            if (error) throw error;
            setStatus('saved');
            // Reset status to idle after a short delay
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error('Error saving note:', err);
            setError('Failed to save note.');
            setStatus('error');
        }
    }, [user, articleId]);
    
    // Effect to trigger save when debouncedNote changes
    useEffect(() => {
        // Only save if the user has been typing and the content has changed
        if (status === 'typing') {
            saveNote(debouncedNote);
        }
    }, [debouncedNote, saveNote, status]);

    const handleNoteChange = (e) => {
        setStatus('typing');
        setNote(e.target.value);
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'loading':
                return <span className="text-xs text-gray-400 flex items-center"><Loader size={12} className="animate-spin mr-1"/> Loading notes...</span>;
            case 'saving':
                return <span className="text-xs text-yellow-400 flex items-center"><Loader size={12} className="animate-spin mr-1"/> Saving...</span>;
            case 'saved':
                return <span className="text-xs text-green-400 flex items-center"><ShieldCheck size={12} className="mr-1"/> Saved</span>;
            case 'error':
                return <span className="text-xs text-red-500 flex items-center"><AlertTriangle size={12} className="mr-1"/> {error || 'Error'}</span>;
            case 'typing':
                 return <span className="text-xs text-gray-400 flex items-center">Typing...</span>;
            default:
                return <span className="text-xs text-gray-500">Your private notes are saved automatically.</span>;
        }
    };

    if (!user) {
        return <p className="text-gray-400">You must be logged in to take private notes.</p>;
    }

    return (
        <div className="bg-black/20 p-4 rounded-none">
            <h3 className="text-lg font-semibold text-white mb-3">My Private Notes</h3>
            <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder="Type your private notes and analysis here. They will be saved automatically..."
                className="w-full bg-gray-900/70 border border-gray-700 rounded-none p-3 text-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                rows={12}
                disabled={status === 'loading'}
            />
            <div className="h-4 mt-2">
                {getStatusIndicator()}
            </div>
        </div>
    );
};

export default PrivateNotes;
