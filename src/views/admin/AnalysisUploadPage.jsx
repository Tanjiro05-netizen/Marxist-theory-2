import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { 
    Upload, FileJson, FileText, Check, AlertTriangle, 
    ArrowLeft, Eye, Save, Plus, Trash2, ChevronDown, ChevronUp,
    Languages
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
];

const AnalysisUploadPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('json');
    const [jsonInput, setJsonInput] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [parseError, setParseError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Form-based editor state
    const [formData, setFormData] = useState({
        slug: '',
        primary_language: 'en',
        available_languages: ['en'],
        category: '',
        tags: [],
        is_published: false,
        metadata: {
            en: {
                title: '',
                authors: [''],
                year: '',
                wordCount: '',
                readingTimeMinutes: '',
                source: '',
                translator: '',
            }
        },
        sections: [{ id: '1', level: 1, title: { en: '' }, content: { en: '' } }],
    });
    const [expandedSections, setExpandedSections] = useState([0]);

    const handleJsonParse = useCallback(() => {
        setParseError(null);
        setParsedData(null);

        if (!jsonInput.trim()) {
            setParseError('Please enter JSON data');
            return;
        }

        try {
            const data = JSON.parse(jsonInput);
            
            // Validate required fields
            if (!data.metadata) {
                throw new Error('Missing "metadata" field');
            }
            if (!data.sections || !Array.isArray(data.sections)) {
                throw new Error('Missing or invalid "sections" array');
            }

            // Transform to our schema if needed
            const transformed = transformJsonToSchema(data);
            setParsedData(transformed);
        } catch (err) {
            setParseError(err.message);
        }
    }, [jsonInput]);

    const transformJsonToSchema = (data) => {
        const primaryLang = data.metadata?.language || 'en';
        const availableLangs = [primaryLang];

        // Check if metadata is already multilingual or flat
        const isMultilingual = typeof data.metadata?.title === 'object';
        
        let metadata = {};
        if (isMultilingual) {
            metadata = data.metadata;
        } else {
            // Convert flat metadata to multilingual format
            metadata[primaryLang] = {
                title: data.metadata?.title || '',
                authors: data.metadata?.authors || [],
                year: data.metadata?.year,
                firstPublished: data.metadata?.firstPublished,
                wordCount: data.metadata?.wordCount,
                readingTimeMinutes: data.metadata?.readingTimeMinutes,
                source: data.metadata?.source,
                translator: data.metadata?.translator,
                transcriber: data.metadata?.transcriber,
            };
        }

        // Transform sections
        const sections = data.sections?.map((section, index) => {
            const isMultilingualSection = typeof section.title === 'object';
            return {
                id: section.id || String(index + 1),
                level: section.level || 1,
                title: isMultilingualSection ? section.title : { [primaryLang]: section.title || '' },
                content: isMultilingualSection ? section.content : { [primaryLang]: section.content || '' },
            };
        }) || [];

        // Transform TOC
        const toc = data.tableOfContents?.map((item) => transformTocItem(item, primaryLang)) || [];

        // Generate slug from title
        const title = metadata[primaryLang]?.title || '';
        const slug = data.slug || title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);

        return {
            slug,
            primary_language: primaryLang,
            available_languages: availableLangs,
            category: data.metadata?.category || '',
            tags: data.metadata?.tags || [],
            is_published: false,
            metadata,
            table_of_contents: toc,
            sections,
        };
    };

    const transformTocItem = (item, primaryLang) => {
        const isMultilingual = typeof item.title === 'object';
        return {
            id: item.id,
            title: isMultilingual ? item.title : { [primaryLang]: item.title || '' },
            level: item.level || 1,
            children: item.children?.map(child => transformTocItem(child, primaryLang)),
        };
    };

    const handleSave = async (dataToSave) => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            // Check if user.id is a valid UUID (dev-admin is not)
            const isValidUuid = user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
            
            const { data, error } = await supabase
                .from('analysis_texts')
                .insert({
                    ...dataToSave,
                    uploaded_by: isValidUuid ? user.id : null,
                })
                .select()
                .single();

            if (error) throw error;

            setSaveSuccess(true);
            setTimeout(() => {
                router.push(`/theory`);
            }, 1500);
        } catch (err) {
            console.error('Error saving text:', err);
            setSaveError(err.message || 'Failed to save text');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setJsonInput(event.target?.result || '');
        };
        reader.readAsText(file);
    };

    // Form handlers
    const updateFormMetadata = (lang, field, value) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [lang]: {
                    ...prev.metadata[lang],
                    [field]: value,
                }
            }
        }));
    };

    const addSection = () => {
        const newIndex = formData.sections.length;
        setFormData(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                { 
                    id: String(newIndex + 1), 
                    level: 1, 
                    title: { [formData.primary_language]: '' }, 
                    content: { [formData.primary_language]: '' } 
                }
            ]
        }));
        setExpandedSections(prev => [...prev, newIndex]);
    };

    const updateSection = (index, field, value, lang = null) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            if (lang) {
                newSections[index] = {
                    ...newSections[index],
                    [field]: {
                        ...newSections[index][field],
                        [lang]: value,
                    }
                };
            } else {
                newSections[index] = {
                    ...newSections[index],
                    [field]: value,
                };
            }
            return { ...prev, sections: newSections };
        });
    };

    const removeSection = (index) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index),
        }));
    };

    const toggleSectionExpanded = (index) => {
        setExpandedSections(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleFormSave = () => {
        // Generate TOC from sections
        const toc = formData.sections.map(section => ({
            id: section.id,
            title: section.title,
            level: section.level,
        }));

        // Generate slug
        const title = formData.metadata[formData.primary_language]?.title || '';
        const slug = formData.slug || title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);

        handleSave({
            ...formData,
            slug,
            table_of_contents: toc,
        });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/theory')}
                        className="p-2 hover:bg-gray-800 rounded-none transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Upload Community Text</h1>
                        <p className="text-gray-400 text-sm">Add a new revolutionary theory text</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 bg-gray-900/50 rounded-none p-2">
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none font-medium transition-colors
                            ${activeTab === 'json' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <FileJson size={18} />
                        JSON Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('form')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-none font-medium transition-colors
                            ${activeTab === 'form' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <FileText size={18} />
                        Form Editor
                    </button>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-none flex items-center gap-3">
                        <Check className="text-green-400" />
                        <span className="text-green-300">Text saved successfully! Redirecting...</span>
                    </div>
                )}

                {/* Error Message */}
                {saveError && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-none flex items-center gap-3">
                        <AlertTriangle className="text-red-400" />
                        <span className="text-red-300">{saveError}</span>
                    </div>
                )}

                {/* JSON Upload Tab */}
                {activeTab === 'json' && (
                    <div className="space-y-6">
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-700 rounded-none p-8 text-center hover:border-red-500/50 transition-colors">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="json-file-upload"
                            />
                            <label htmlFor="json-file-upload" className="cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                                <p className="text-gray-300">Drop a JSON file here or click to browse</p>
                                <p className="text-gray-500 text-sm mt-1">Supports structured text JSON format</p>
                            </label>
                        </div>

                        {/* JSON Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Or paste JSON directly:
                            </label>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                placeholder='{"metadata": {...}, "sections": [...]}'
                                className="w-full h-64 bg-gray-900 border border-gray-700 rounded-none p-4 font-mono text-sm text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-y"
                            />
                        </div>

                        {/* Parse Error */}
                        {parseError && (
                            <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-none flex items-start gap-3">
                                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <p className="text-red-300 font-medium">Parse Error</p>
                                    <p className="text-red-400/80 text-sm">{parseError}</p>
                                </div>
                            </div>
                        )}

                        {/* Parse Button */}
                        <button
                            onClick={handleJsonParse}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-none font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye size={18} />
                            Preview & Validate
                        </button>

                        {/* Preview */}
                        {parsedData && (
                            <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Check className="text-green-400" size={20} />
                                    Valid JSON - Preview
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Title:</span>
                                        <p className="text-white">{parsedData.metadata?.[parsedData.primary_language]?.title || 'Untitled'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Slug:</span>
                                        <p className="text-white font-mono">{parsedData.slug}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Authors:</span>
                                        <p className="text-white">{parsedData.metadata?.[parsedData.primary_language]?.authors?.join(', ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Language:</span>
                                        <p className="text-white">{parsedData.primary_language}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Sections:</span>
                                        <p className="text-white">{parsedData.sections?.length || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Category:</span>
                                        <p className="text-white">{parsedData.category || 'None'}</p>
                                    </div>
                                </div>

                                {/* Slug Editor */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">URL Slug (editable):</label>
                                    <input
                                        type="text"
                                        value={parsedData.slug}
                                        onChange={(e) => setParsedData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white font-mono text-sm"
                                    />
                                </div>

                                {/* Publish Toggle */}
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={parsedData.is_published}
                                        onChange={(e) => setParsedData(prev => ({ ...prev, is_published: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-gray-300">Publish immediately</span>
                                </label>

                                {/* Save Button */}
                                <button
                                    onClick={() => handleSave(parsedData)}
                                    disabled={saving}
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-none font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>Saving...</>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Text
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Editor Tab */}
                {activeTab === 'form' && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">URL Slug</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        placeholder="auto-generated-from-title"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Primary Language</label>
                                    <select
                                        value={formData.primary_language}
                                        onChange={(e) => setFormData(prev => ({ ...prev, primary_language: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        placeholder="e.g., Philosophy, Economics"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags.join(', ')}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                        }))}
                                        placeholder="marxism, theory, economics"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Languages size={20} />
                                Metadata ({SUPPORTED_LANGUAGES.find(l => l.code === formData.primary_language)?.name})
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.metadata[formData.primary_language]?.title || ''}
                                        onChange={(e) => updateFormMetadata(formData.primary_language, 'title', e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Authors (one per line)</label>
                                    <textarea
                                        value={(formData.metadata[formData.primary_language]?.authors || []).join('\n')}
                                        onChange={(e) => updateFormMetadata(
                                            formData.primary_language, 
                                            'authors', 
                                            e.target.value.split('\n').filter(Boolean)
                                        )}
                                        rows={2}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white resize-y"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Year</label>
                                        <input
                                            type="number"
                                            value={formData.metadata[formData.primary_language]?.year || ''}
                                            onChange={(e) => updateFormMetadata(formData.primary_language, 'year', parseInt(e.target.value) || '')}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Word Count</label>
                                        <input
                                            type="number"
                                            value={formData.metadata[formData.primary_language]?.wordCount || ''}
                                            onChange={(e) => updateFormMetadata(formData.primary_language, 'wordCount', parseInt(e.target.value) || '')}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Reading Time (min)</label>
                                        <input
                                            type="number"
                                            value={formData.metadata[formData.primary_language]?.readingTimeMinutes || ''}
                                            onChange={(e) => updateFormMetadata(formData.primary_language, 'readingTimeMinutes', parseInt(e.target.value) || '')}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Source</label>
                                        <input
                                            type="text"
                                            value={formData.metadata[formData.primary_language]?.source || ''}
                                            onChange={(e) => updateFormMetadata(formData.primary_language, 'source', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-none px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="bg-gray-900/50 rounded-none p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Sections</h3>
                                <button
                                    onClick={addSection}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-none text-sm transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Section
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.sections.map((section, index) => (
                                    <div key={index} className="bg-gray-800/50 rounded-none border border-gray-700">
                                        <div 
                                            className="flex items-center justify-between p-3 cursor-pointer"
                                            onClick={() => toggleSectionExpanded(index)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedSections.includes(index) ? (
                                                    <ChevronUp size={18} className="text-gray-500" />
                                                ) : (
                                                    <ChevronDown size={18} className="text-gray-500" />
                                                )}
                                                <span className="text-sm text-gray-400">§{section.id}</span>
                                                <span className="text-white">
                                                    {section.title[formData.primary_language] || `Section ${index + 1}`}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeSection(index); }}
                                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {expandedSections.includes(index) && (
                                            <div className="p-4 pt-0 space-y-3 border-t border-gray-700">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Section ID</label>
                                                        <input
                                                            type="text"
                                                            value={section.id}
                                                            onChange={(e) => updateSection(index, 'id', e.target.value)}
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Level (1-6)</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="6"
                                                            value={section.level}
                                                            onChange={(e) => updateSection(index, 'level', parseInt(e.target.value) || 1)}
                                                            className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={section.title[formData.primary_language] || ''}
                                                        onChange={(e) => updateSection(index, 'title', e.target.value, formData.primary_language)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Content (HTML or plain text)</label>
                                                    <textarea
                                                        value={section.content[formData.primary_language] || ''}
                                                        onChange={(e) => updateSection(index, 'content', e.target.value, formData.primary_language)}
                                                        rows={6}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white resize-y font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Publish & Save */}
                        <div className="flex items-center justify-between bg-gray-900/50 rounded-none p-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_published}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-gray-300">Publish immediately</span>
                            </label>

                            <button
                                onClick={handleFormSave}
                                disabled={saving || !formData.metadata[formData.primary_language]?.title}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-none font-medium transition-colors flex items-center gap-2"
                            >
                                {saving ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Save Text
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisUploadPage;
