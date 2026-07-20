import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { 
    Upload, Check, AlertTriangle, 
    Save, X, Loader2, Headphones, Globe, Link, Plus
} from 'lucide-react';

const emptyAudiobook = {
    title: '',
    author: '',
    narrator: '',
    description: '',
    audio_url: '',
    cover_url: '',
    duration_seconds: '',
    chapters: [],
    category: '',
    is_featured: false,
    sort_order: 0,
};

const emptyChapter = { title: '', start_seconds: '' };

const AudiobookUploadForm = ({ editId }) => {
    const router = useRouter();
    
    const [audiobookForm, setAudiobookForm] = useState(emptyAudiobook);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [audioSourceMode, setAudioSourceMode] = useState('upload'); // 'upload' | 'archive'
    const [archiveUrl, setArchiveUrl] = useState('');

    useEffect(() => {
        if (!editId) return;
        const fetchAudiobook = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('audiobooks')
                    .select('*')
                    .eq('id', editId)
                    .single();
                if (fetchError) throw fetchError;
                if (data) {
                    setAudiobookForm({
                        ...data,
                        duration_seconds: data.duration_seconds || '',
                        chapters: data.chapters || [],
                    });
                    if (data.audio_url && data.audio_url.includes('archive.org')) {
                        setAudioSourceMode('archive');
                    }
                }
            } catch (err) {
                console.error('Error fetching audiobook:', err);
                setError(err.message || 'Failed to load audiobook for editing.');
            } finally {
                setLoading(false);
            }
        };
        fetchAudiobook();
    }, [editId]);

    const compressImage = (file, maxDim = 800, quality = 0.85) => new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            if (width <= maxDim && height <= maxDim && file.size < 500_000) {
                resolve(file);
                return;
            }
            const scale = Math.min(maxDim / width, maxDim / height, 1);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => (blob ? resolve(new File([blob], file.name, { type: 'image/jpeg' })) : reject(new Error('Compression failed'))),
                'image/jpeg',
                quality,
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to read image')); };
        img.src = url;
    });

    const uploadFile = async (file, folder) => {
        const ext = file.name.split('.').pop();
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from('audiobooks')
            .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('audiobooks').getPublicUrl(path);
        return urlData.publicUrl;
    };

    const parseArchiveOrgUrl = (url) => {
        try {
            const u = new URL(url.trim());
            if (u.hostname !== 'archive.org' && u.hostname !== 'www.archive.org') return null;
            const match = u.pathname.match(/^\/(details|download)\/([^/]+)/);
            if (!match) return null;
            const identifier = match[2];
            if (match[1] === 'download' && u.pathname.split('/').filter(Boolean).length > 2) {
                return url.trim();
            }
            return `https://archive.org/download/${identifier}/${identifier}.mp3`;
        } catch {
            return null;
        }
    };

    const handleArchiveUrl = () => {
        const directUrl = parseArchiveOrgUrl(archiveUrl);
        if (!directUrl) {
            setError('Invalid Internet Archive URL. Please paste a link like: https://archive.org/details/...');
            return;
        }
        setError('');
        setAudiobookForm((p) => ({ ...p, audio_url: directUrl }));
        setSuccess('Internet Archive link added.');
    };

    const handleAudioFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            setError(`Audio file must be under 50 MB (yours is ${(file.size / 1024 / 1024).toFixed(1)} MB). Please compress it first — e.g. convert to 128kbps MP3.`);
            return;
        }
        setUploadingAudio(true);
        setError('');
        try {
            const url = await uploadFile(file, 'audio');
            setAudiobookForm((p) => ({ ...p, audio_url: url }));
            setSuccess('Audio file uploaded.');
        } catch (err) {
            console.error('Audio upload error:', err);
            setError(err.message || 'Failed to upload audio file.');
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleCoverFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError('Cover image must be under 10 MB.');
            return;
        }
        setUploadingCover(true);
        setError('');
        try {
            const compressed = await compressImage(file);
            const url = await uploadFile(compressed, 'covers');
            setAudiobookForm((p) => ({ ...p, cover_url: url }));
            setSuccess('Cover image uploaded.');
        } catch (err) {
            console.error('Cover upload error:', err);
            setError(err.message || 'Failed to upload cover image.');
        } finally {
            setUploadingCover(false);
        }
    };

    const addChapter = () => {
        setAudiobookForm((p) => ({ ...p, chapters: [...(p.chapters || []), { ...emptyChapter }] }));
    };

    const removeChapter = (index) => {
        setAudiobookForm((p) => ({ ...p, chapters: p.chapters.filter((_, i) => i !== index) }));
    };

    const updateChapter = (index, field, value) => {
        setAudiobookForm((p) => ({
            ...p,
            chapters: p.chapters.map((ch, i) => (i === index ? { ...ch, [field]: value } : ch)),
        }));
    };

    const handleSaveAudiobook = async (e) => {
        e.preventDefault();
        if (!audiobookForm.title.trim()) {
            setError('Audiobook title is required.');
            return;
        }
        if (!audiobookForm.audio_url.trim()) {
            setError('Audio file is required.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                title: audiobookForm.title.trim(),
                author: audiobookForm.author.trim() || null,
                narrator: audiobookForm.narrator.trim() || null,
                description: audiobookForm.description.trim() || null,
                audio_url: audiobookForm.audio_url.trim(),
                cover_url: audiobookForm.cover_url.trim() || null,
                duration_seconds: parseInt(audiobookForm.duration_seconds, 10) || null,
                chapters: (audiobookForm.chapters || []).filter((ch) => ch.title.trim()).map((ch) => ({
                    title: ch.title.trim(),
                    start_seconds: parseInt(ch.start_seconds, 10) || 0,
                })),
                category: audiobookForm.category.trim() || null,
                is_featured: audiobookForm.is_featured === true,
                sort_order: parseInt(audiobookForm.sort_order, 10) || 0,
            };

            if (editId) {
                const { error: updateError } = await supabase
                    .from('audiobooks')
                    .update(payload)
                    .eq('id', editId);
                if (updateError) throw updateError;
                setSuccess('Audiobook updated successfully!');
            } else {
                const { error: insertError } = await supabase
                    .from('audiobooks')
                    .insert(payload);
                if (insertError) throw insertError;
                setSuccess('Audiobook uploaded successfully!');
            }
            setTimeout(() => {
                router.push('/digital-library');
            }, 1500);

        } catch (err) {
            console.error('Error saving audiobook:', err);
            setError(err.message || 'Failed to save audiobook.');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none';
    const labelClass = 'block text-sm text-gray-400 mb-1';

    return (
        <div>
            {success && (
                <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-xl flex items-center gap-3">
                    <Check className="text-green-400" />
                    <span className="text-green-300">{success}</span>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="text-red-400" />
                    <span className="text-red-300">{error}</span>
                </div>
            )}

            {loading && (
                <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700/50 rounded-xl flex items-center gap-3 text-gray-300">
                    <Loader2 className="animate-spin" size={18} />
                    <span>Loading audiobook data...</span>
                </div>
            )}

            <form onSubmit={handleSaveAudiobook} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio Upload */}
                    <div className="bg-gray-900/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Headphones className="text-red-500" size={20} />
                            Audio Source *
                        </h3>
                        {audiobookForm.audio_url ? (
                            <div className="flex items-center gap-2 text-sm bg-gray-800 p-3 rounded-lg">
                                {audiobookForm.audio_url.includes('archive.org/download/') ? (
                                    <>
                                        <Globe size={18} className="text-blue-400 flex-shrink-0" />
                                        <span className="text-gray-300 truncate flex-1" title={audiobookForm.audio_url}>
                                            Internet Archive: {audiobookForm.audio_url.match(/\/download\/([^/]+)/)?.[1] || audiobookForm.audio_url}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Headphones size={18} className="text-purple-400 flex-shrink-0" />
                                        <span className="text-gray-300 truncate flex-1">{audiobookForm.audio_url.split('/').pop()}</span>
                                    </>
                                )}
                                <button type="button" onClick={() => { setAudiobookForm((p) => ({ ...p, audio_url: '' })); setArchiveUrl(''); }} className="p-1 text-gray-400 hover:text-red-400 flex-shrink-0">
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 mb-4 bg-gray-800 rounded-lg p-1 border border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={() => setAudioSourceMode('upload')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${audioSourceMode === 'upload' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <Upload size={16} /> Upload MP3
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAudioSourceMode('archive')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${audioSourceMode === 'archive' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <Globe size={16} /> Internet Archive
                                    </button>
                                </div>

                                {audioSourceMode === 'upload' ? (
                                    <div className={`border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-500/50 transition-colors ${uploadingAudio ? 'opacity-60 pointer-events-none' : ''}`}>
                                        <input type="file" accept="audio/*" onChange={handleAudioFileChange} className="hidden" id="audio-upload" />
                                        <label htmlFor="audio-upload" className="cursor-pointer">
                                            {uploadingAudio ? <Loader2 className="w-10 h-10 mx-auto text-red-500 mb-2 animate-spin" /> : <Upload className="w-10 h-10 mx-auto text-gray-500 mb-2" />}
                                            <p className="text-gray-400 text-sm">{uploadingAudio ? 'Uploading...' : 'Click to upload audio (max 50 MB)'}</p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={archiveUrl}
                                                onChange={(e) => setArchiveUrl(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleArchiveUrl(); } }}
                                                placeholder="https://archive.org/details/..."
                                                className={`${inputClass} flex-1`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleArchiveUrl}
                                                disabled={!archiveUrl.trim()}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0"
                                            >
                                                <Link size={16} /> Use Link
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Paste an <code className="text-gray-400">archive.org/details/</code> or <code className="text-gray-400">archive.org/download/</code> link
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Cover Image Upload */}
                    <div className="bg-gray-900/50 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Upload className="text-red-500" size={20} />
                            Cover Image
                        </h3>
                        {audiobookForm.cover_url ? (
                            <div className="relative">
                                <img src={audiobookForm.cover_url} alt="Cover preview" className="w-full h-32 object-contain bg-gray-800 rounded-lg" />
                                <button type="button" onClick={() => setAudiobookForm((p) => ({ ...p, cover_url: '' }))} className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full text-gray-400 hover:text-red-400">
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className={`border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-500/50 transition-colors ${uploadingCover ? 'opacity-60 pointer-events-none' : ''}`}>
                                <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" id="audiobook-cover-upload" />
                                <label htmlFor="audiobook-cover-upload" className="cursor-pointer">
                                    {uploadingCover ? <Loader2 className="w-10 h-10 mx-auto text-red-500 mb-2 animate-spin" /> : <Upload className="w-10 h-10 mx-auto text-gray-500 mb-2" />}
                                    <p className="text-gray-400 text-sm">{uploadingCover ? 'Uploading...' : 'Click to upload cover'}</p>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metadata Form */}
                <div className="bg-gray-900/50 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Audiobook Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelClass}>Title *</label>
                            <input type="text" value={audiobookForm.title} onChange={(e) => setAudiobookForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} required />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Author</label>
                            <input type="text" value={audiobookForm.author} onChange={(e) => setAudiobookForm((p) => ({ ...p, author: e.target.value }))} className={inputClass} />
                        </div>

                        <div>
                            <label className={labelClass}>Narrator</label>
                            <input type="text" value={audiobookForm.narrator} onChange={(e) => setAudiobookForm((p) => ({ ...p, narrator: e.target.value }))} className={inputClass} />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Category</label>
                            <input type="text" value={audiobookForm.category} onChange={(e) => setAudiobookForm((p) => ({ ...p, category: e.target.value }))} className={inputClass} placeholder="e.g. Political Economy" />
                        </div>
                        
                        <div>
                            <label className={labelClass}>Duration (seconds)</label>
                            <input type="number" value={audiobookForm.duration_seconds} onChange={(e) => setAudiobookForm((p) => ({ ...p, duration_seconds: e.target.value }))} className={inputClass} placeholder="e.g. 3600" />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea value={audiobookForm.description} onChange={(e) => setAudiobookForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={inputClass} />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={audiobookForm.is_featured}
                                    onChange={(e) => setAudiobookForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                            </label>
                            <span className="text-sm text-gray-300">Featured Audiobook</span>
                        </div>
                    </div>
                </div>

                {/* Chapters */}
                <div className="bg-gray-900/50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Chapters</h3>
                        <button type="button" onClick={addChapter} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-white transition-colors">
                            <Plus size={14} /> Add Chapter
                        </button>
                    </div>
                    
                    {(audiobookForm.chapters || []).length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-700 rounded-lg">No chapters added yet. You can add chapters to allow users to navigate the audiobook easily.</p>
                    ) : (
                        <div className="space-y-3">
                            {audiobookForm.chapters.map((ch, i) => (
                                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                    <span className="text-sm font-medium text-gray-400 w-6 flex-shrink-0">{i + 1}.</span>
                                    <input
                                        type="text"
                                        value={ch.title}
                                        onChange={(e) => updateChapter(i, 'title', e.target.value)}
                                        placeholder="Chapter title"
                                        className={`${inputClass} flex-1`}
                                    />
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="number"
                                            value={ch.start_seconds}
                                            onChange={(e) => updateChapter(i, 'start_seconds', e.target.value)}
                                            placeholder="Start (seconds)"
                                            className={`${inputClass} w-full sm:w-32`}
                                        />
                                        <button type="button" onClick={() => removeChapter(i)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={saving || !audiobookForm.title || !audiobookForm.audio_url || uploadingAudio || uploadingCover}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            {editId ? 'Saving...' : 'Uploading...'}
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            {editId ? 'Save Changes' : 'Upload Audiobook'}
                        </>
                    )}
                </button>
                {editId && (
                    <button
                        type="button"
                        onClick={() => router.push('/digital-library')}
                        className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors text-gray-300"
                    >
                        Cancel
                    </button>
                )}
            </form>
        </div>
    );
};

export default AudiobookUploadForm;
