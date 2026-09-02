import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { UploadIcon, Info, CheckCircle, AlertTriangle, Loader2, FileText, X, ShieldCheck, CloudUpload } from "lucide-react";
import SubmissionGuidelines from "../components/SubmissionGuidelines";
import TurnstileWidget from '../components/TurnstileWidget';
import Select from 'react-select';
import * as s from './SubmitPage.css.ts';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf'];

const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readApiError = async (response, fallback) => {
    const body = await response.json().catch(() => ({}));
    return body.message || body.error || fallback;
};

const uploadToR2 = (uploadUrl, file, onProgress) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.setRequestHeader('Content-Type', file.type);
    request.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
        if (request.status >= 200 && request.status < 300) resolve();
        else reject(new Error('The manuscript upload could not be completed.'));
    });
    request.addEventListener('error', () => reject(new Error('The manuscript upload was interrupted.')));
    request.send(file);
});

const SubmitPage = () => {

    const { t } = useTranslation();
    const { user } = useAuth();
    const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [initializingTags, setInitializingTags] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [abstract, setAbstract] = useState('');

    const [category, setCategory] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Submission status
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [turnstileToken, setTurnstileToken] = useState(null);
    const [turnstileResetKey, setTurnstileResetKey] = useState(0);
    const handleTurnstileToken = useCallback((token) => setTurnstileToken(token), []);

    // Data for dropdowns
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    // Check if user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) return;
            
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                    
                if (error) throw error;
                setIsAdmin(data?.role === 'admin');
            } catch (err) {
                console.error("Error checking admin status:", err);
            }
        };
        
        checkAdmin();
    }, [user]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch categories
                const { data: categoriesData, error: categoriesError } = await supabase
                    .from('theory_categories')
                    .select('id, name');
                if (categoriesError) throw categoriesError;
                setCategories(categoriesData);
                console.log('Categories loaded:', categoriesData);
                
                // Fetch tags with explicit logging
                console.log('Fetching tags...');
                const { data: tagsData, error: tagsError } = await supabase
                    .from('theory_tags')
                    .select('id, name');
                
                if (tagsError) {
                    console.error('Error fetching tags:', tagsError);
                    throw tagsError;
                }
                
                console.log('Tags data received:', tagsData);
                
                if (!tagsData || tagsData.length === 0) {
                    console.warn('No tags found in database. The tags table might be empty.');
                } else {
                    const formattedTags = tagsData.map(t => ({ value: t.id, label: t.name }));
                    console.log('Formatted tags:', formattedTags);
                    setTags(formattedTags);
                }
            } catch (err) {
                console.error('Error in fetchData:', err);
                setError(err.message);
            }
        };
        fetchData();
    }, []);

    // Function to initialize tags in the database
    const initializeTags = async () => {
        if (!isAdmin) return;
        
        setInitializingTags(true);
        setError(null);
        
        const initialTags = [
            "Marxism",
            "Socialism",
            "Communism",
            "Historical Materialism",
            "Class Struggle",
            "Dialectical Materialism",
            "Political Economy",
            "Imperialism",
            "Revolution",
            "Labor Theory",
            "Alienation",
            "State Theory",
            "Critical Theory"
        ];
        
        try {
            // First check if any tags already exist to prevent duplicates
            const { data: existingTags } = await supabase
                .from('theory_tags')
                .select('name');
            
            const existingTagNames = existingTags ? existingTags.map(tag => tag.name) : [];
            
            // Filter out tags that already exist
            const tagsToAdd = initialTags.filter(tag => !existingTagNames.includes(tag));
            
            if (tagsToAdd.length === 0) {
                setError('Tags already initialized');
                return;
            }
            
            // Format tags for insertion
            const tagsForInsert = tagsToAdd.map(name => ({
                name,
                created_at: new Date().toISOString()
            }));
            
            // Insert the tags
            const { error: insertError } = await supabase
                .from('theory_tags')
                .insert(tagsForInsert);
                
            if (insertError) throw insertError;
            
            // Refresh tags list after insertion
            const { data: refreshedTags, error: refreshError } = await supabase
                .from('theory_tags')
                .select('id, name');
                
            if (refreshError) throw refreshError;
            
            setTags(refreshedTags.map(t => ({ value: t.id, label: t.name })));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000); // Clear success after 3 seconds
            
        } catch (err) {
            console.error('Error initializing tags:', err);
            setError(`Failed to initialize tags: ${err.message}`);
        } finally {
            setInitializingTags(false);
        }
    };
    
    const selectFile = (selectedFile) => {
        if (selectedFile) {
            if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
                setError('Upload a PDF manuscript. Word documents are not accepted.');
                setFile(null);
                setFileName('');
                return;
            }
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('The manuscript is too large. The maximum size is 50 MB.');
                setFile(null);
                setFileName('');
                return;
            }
            setError(null);
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleFileChange = (event) => selectFile(event.target.files?.[0]);

    const handleDrop = (event) => {
        event.preventDefault();
        setDragActive(false);
        selectFile(event.dataTransfer.files?.[0]);
    };

    const clearFile = () => {
        setFile(null);
        setFileName('');
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSuccessMessage('');

        if (!file || !title || !abstract || !category || selectedTags.length === 0) {
            setError(t('submit.missingFields'));
            return;
        }

        if (!turnstileToken) {
            setError('Complete the security check before submitting.');
            return;
        }

        setSubmitting(true);
        setUploadProgress(0);

        let uploadTarget = null;

        try {
            // 1. Ask the server for a provider-specific, short-lived upload target.
            const uploadResponse = await fetch('/api/submissions/upload-url', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                    contentType: file.type,
                    turnstileToken,
                }),
            });

            if (!uploadResponse.ok) {
                throw new Error(await readApiError(uploadResponse, 'Could not prepare the manuscript upload.'));
            }

            uploadTarget = await uploadResponse.json();

            if (uploadTarget.provider === 'r2') {
                await uploadToR2(uploadTarget.uploadUrl, file, setUploadProgress);
            } else {
                setUploadProgress(25);
                const { error: uploadError } = await supabase.storage
                    .from(uploadTarget.bucket)
                    .uploadToSignedUrl(uploadTarget.objectKey, uploadTarget.token, file, {
                        contentType: file.type,
                        upsert: false,
                    });
                if (uploadError) throw uploadError;
                setUploadProgress(100);
            }

            // 2. Save metadata through the server so the authenticated session
            // used for the upload and the database insert cannot diverge.
            const submissionResponse = await fetch('/api/submissions', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    abstract,
                    categoryId: category,
                    tagIds: selectedTags.map(t => t.value),
                    uploadSessionId: uploadTarget.uploadSessionId,
                }),
            });
            if (!submissionResponse.ok) {
                throw new Error(await readApiError(submissionResponse, 'Could not save the submission.'));
            }

            const submissionResult = await submissionResponse.json();
            uploadTarget.finalized = true;
            setTurnstileToken(null);
            setTurnstileResetKey((key) => key + 1);

            if (submissionResult.scanStatus === 'infected') {
                clearFile();
                setError(submissionResult.message || 'The PDF was rejected by the safety scanner.');
                return;
            }

            // 3. Handle success
            setSuccess(true);
            setSuccessMessage(submissionResult.message || t('submit.success'));
            setTitle('');
            setAbstract('');

            setCategory('');
            setSelectedTags([]);
            clearFile();

        } catch (error) {
            if (uploadTarget?.uploadSessionId && !uploadTarget.finalized) {
                await fetch('/api/submissions/file', {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uploadSessionId: uploadTarget.uploadSessionId,
                    }),
                }).catch(() => {});
            }
            setTurnstileToken(null);
            setTurnstileResetKey((key) => key + 1);
            setError(error.message);
            console.error('Submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={s.page}>
            <header className={s.hero}>
                <div className={s.heroGrid} />
                <div className={s.heroContent}>
                    <div className={s.heroCopy}>
                        <p className={s.heroKicker}>{t('submit.kicker')}</p>
                        <h1 className={s.heroTitle}>{t('submit.title')}</h1>
                        <div className={s.heroRule} aria-hidden="true" />
                        <p className={s.heroQuote}>
                            {t('submit.quote')}
                        </p>
                    </div>
                </div>
            </header>

            <section className={s.formSection}>
                <div className={s.workspace}>
                    <aside className={s.contextPanel}>
                        <p className={s.contextKicker}>Editorial intake</p>
                        <h2 className={s.contextTitle}>Share work that advances collective understanding.</h2>
                        <p className={s.contextText}>
                            Submit as a guest or through your account. Your manuscript remains private while it is reviewed, and only authorized editors can preview it securely.
                        </p>
                        <div className={s.contextList}>
                            <div className={s.contextItem}><span>01</span><p><strong>Describe</strong>Your title, abstract, category, and themes.</p></div>
                            <div className={s.contextItem}><span>02</span><p><strong>Attach</strong>Upload the complete manuscript for editorial review.</p></div>
                            <div className={s.contextItem}><span>03</span><p><strong>Submit</strong>The editorial queue records your work immediately.</p></div>
                        </div>
                        <div className={s.privacyNote}>
                            <ShieldCheck size={17} />
                            <span>Private storage · time-limited reviewer access</span>
                        </div>
                    </aside>

                    <div className={s.formCard}>
                        <div className={s.formHeader}>
                            <div>
                                <p className={s.formEyebrow}>New submission</p>
                                <h2 className={s.formTitle}>Manuscript details</h2>
                            </div>
                            <span className={s.draftBadge}>Draft</span>
                        </div>
                    <form onSubmit={handleSubmit} className={s.form}>
                        <div className={s.topActions}>
                            <button type="button" onClick={() => setShowGuidelinesModal(true)} className={s.guidelineBtn}>
                                <Info size={18} />
                                <span>{t('submit.viewGuidelines')}</span>
                            </button>
                            {isAdmin && (
                                <button type="button" onClick={initializeTags} disabled={initializingTags} className={s.adminBtn}>
                                    {initializingTags ? (<><Loader2 size={14} /> Adding tags...</>) : (<span>Initialize Tags (Admin)</span>)}
                                </button>
                            )}
                        </div>

                        <div className={s.fieldGrid}>
                        <div className={s.fieldBlock}>
                            <label htmlFor="category" className={s.fieldLabel}><span>01</span>{t('submit.category')}</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={s.selectInput} required>
                                <option value="" disabled>{t('submit.selectCategory')}</option>
                                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                            </select>
                        </div>

                        <div className={s.fieldBlock}>
                            <label htmlFor="title" className={s.fieldLabel}><span>02</span>{t('submit.workTitle')}</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={s.textInput} placeholder={t('submit.titlePlaceholder')} required />
                        </div>
                        </div>

                        <div className={s.fieldBlock}>
                            <label htmlFor="abstract" className={s.fieldLabel}><span>03</span>{t('submit.abstract')}</label>
                            <textarea id="abstract" rows="4" value={abstract} onChange={(e) => setAbstract(e.target.value)} className={s.textArea} placeholder={t('submit.abstractPlaceholder')} required />
                            <div className={s.fieldMeta}><span>Give editors the argument and contribution in a few sentences.</span><span>{abstract.length} characters</span></div>
                        </div>

                        <div className={s.fieldBlock}>
                            <label htmlFor="tags" className={s.fieldLabel}><span>04</span>{t('submit.tags')}</label>
                            <Select
                                id="tags"
                                isMulti
                                options={tags}
                                value={selectedTags}
                                onChange={setSelectedTags}
                                classNamePrefix="select"
                                placeholder={t('submit.selectTags')}
                                styles={{
                                    control: (base) => ({ ...base, backgroundColor: '#1a1f2b', borderColor: 'rgba(255,255,255,0.06)', color: 'white' }),
                                    multiValue: (base) => ({ ...base, backgroundColor: '#b3122e' }),
                                    multiValueLabel: (base) => ({ ...base, color: 'white' }),
                                    option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? '#b3122e' : isFocused ? '#151924' : '#10131b', color: 'white' }),
                                    menu: (base) => ({ ...base, backgroundColor: '#10131b', border: '1px solid rgba(255,255,255,0.06)' }),
                                    input: (base) => ({ ...base, color: 'white' }),
                                    singleValue: (base) => ({ ...base, color: 'white' }),
                                }}
                            />
                        </div>

                        <div className={s.fieldBlock}>
                            <label className={s.fieldLabel}><span>05</span>{t('submit.uploadManuscript')}</label>
                            {!file ? (
                                <div
                                    className={`${s.uploadZone} ${dragActive ? s.uploadZoneActive : ''}`}
                                    onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                >
                                    <CloudUpload size={30} strokeWidth={1.4} />
                                    <strong>Drop your manuscript here</strong>
                                    <span>or choose a file from your computer</span>
                                    <button type="button" className={s.chooseFileBtn} onClick={() => fileInputRef.current?.click()}>
                                        {t('submit.chooseFile')}
                                    </button>
                                </div>
                            ) : (
                                <div className={s.fileCard}>
                                    <div className={s.fileIcon}><FileText size={24} /></div>
                                    <div className={s.fileInfo}>
                                        <strong>{fileName}</strong>
                                        <span>{formatFileSize(file.size)} · PDF document</span>
                                        {submitting && (
                                            <div className={s.progressTrack}><span style={{ width: `${uploadProgress}%` }} /></div>
                                        )}
                                    </div>
                                    <button type="button" className={s.removeFileBtn} onClick={clearFile} disabled={submitting} aria-label="Remove manuscript">
                                        <X size={17} />
                                    </button>
                                </div>
                            )}
                            <input ref={fileInputRef} id="manuscript-upload" type="file" className={s.hiddenInput} onChange={handleFileChange} accept=".pdf,application/pdf" />
                            <p className={s.uploadHint}>PDF only · maximum 50 MB · private and locked until safety-checked</p>
                        </div>

                        <TurnstileWidget
                            onToken={handleTurnstileToken}
                            resetKey={turnstileResetKey}
                            className={s.turnstile}
                        />

                        {error && (
                            <div className={s.errorBox}>
                                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className={s.successBox}>
                                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{successMessage || t('submit.success')}</span>
                            </div>
                        )}

                        <div className={s.submitRow}>
                            <div className={s.submitAssurance}>
                                <ShieldCheck size={16} />
                                <span>Only authorized editors can access the manuscript.</span>
                            </div>
                            <button type="submit" disabled={submitting || !turnstileToken} className={s.submitBtn}>
                                {submitting ? (<><Loader2 className={s.spinner} size={18} /> Uploading {uploadProgress ? `${uploadProgress}%` : ''}</>) : (<><UploadIcon size={18} /> {t('submit.submitWork')}</>)}
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
            </section>

            <SubmissionGuidelines isOpen={showGuidelinesModal} onClose={() => setShowGuidelinesModal(false)} />
        </div>
    );
}

export default SubmitPage;
