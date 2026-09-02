import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import BlockRenderer from '../ScienceTech/blocks/BlockRenderer';
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  Type, AlertCircle, Image as ImageIcon, Video, BookOpen,
  HelpCircle, Code, Sparkles, AlignLeft, Table, ExternalLink,
  Minus, Upload, Loader2, Eye, EyeOff
} from 'lucide-react';

const BLOCK_TYPES = [
  { type: 'text', label: 'Text', icon: Type, desc: 'Markdown + math' },
  { type: 'callout', label: 'Callout', icon: AlertCircle, desc: 'Definition, tip, warning' },
  { type: 'image', label: 'Image', icon: ImageIcon, desc: 'With caption & zoom' },
  { type: 'video', label: 'Video', icon: Video, desc: 'YouTube or hosted' },
  { type: 'worked_example', label: 'Worked Example', icon: BookOpen, desc: 'Step-by-step solution' },
  { type: 'inline_exercise', label: 'Exercise', icon: HelpCircle, desc: 'MCQ, numeric, fill-blank' },
  { type: 'code_sandbox', label: 'Code Sandbox', icon: Code, desc: 'JS or Python runner' },
  { type: 'interactive_widget', label: 'Widget', icon: Sparkles, desc: 'Plotter, sim, converter' },
  { type: 'summary', label: 'Summary', icon: AlignLeft, desc: 'Key takeaways list' },
  { type: 'divider', label: 'Divider', icon: Minus, desc: 'Visual separator' },
  { type: 'table', label: 'Table', icon: Table, desc: 'Structured data' },
  { type: 'embed', label: 'Embed', icon: ExternalLink, desc: 'Iframe (Desmos, etc.)' },
];

const DEFAULT_BLOCKS = {
  text: { type: 'text', content: '' },
  callout: { type: 'callout', variant: 'tip', title: '', content: '' },
  image: { type: 'image', url: '', caption: '', alt: '' },
  video: { type: 'video', url: '', caption: '', start: null, end: null },
  worked_example: { type: 'worked_example', title: '', steps: [{ label: '', content: '' }] },
  inline_exercise: { type: 'inline_exercise', exercise_type: 'multiple_choice', question: '', options: [], correct_answer: '', hint: '', explanation: '' },
  code_sandbox: { type: 'code_sandbox', language: 'python', starter_code: '', solution: '', instructions: '' },
  interactive_widget: { type: 'interactive_widget', widget_type: 'function_plotter', config: {} },
  summary: { type: 'summary', points: [''] },
  divider: { type: 'divider', label: '' },
  table: { type: 'table', headers: ['Column 1', 'Column 2'], rows: [['', '']], caption: '' },
  embed: { type: 'embed', url: '', caption: '', aspect_ratio: '16/9' },
};

const VARIANTS = ['definition', 'warning', 'tip', 'key_insight', 'example'];
const EXERCISE_TYPES = ['multiple_choice', 'numeric', 'fill_blank'];
const WIDGET_TYPES = ['function_plotter', 'projectile_motion', 'spring_mass', 'unit_converter'];
const CODE_LANGUAGES = ['python', 'javascript'];

const uploadImage = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `course-assets/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('course-assets').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('course-assets').getPublicUrl(path);
  return data.publicUrl;
};

const BlockBuilder = ({ blocks, onChange }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileRef = useRef(null);

  const addBlock = (type) => {
    onChange([...blocks, JSON.parse(JSON.stringify(DEFAULT_BLOCKS[type]))]);
  };

  const updateBlock = (idx, patch) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const deleteBlock = (idx) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx, dir) => {
    const next = [...blocks];
    const swap = next[idx + dir];
    next[idx + dir] = next[idx];
    next[idx] = swap;
    onChange(next);
  };

  const handleImageUpload = async (idx, file) => {
    if (!file) return;
    setUploadingIdx(idx);
    try {
      const url = await uploadImage(file);
      updateBlock(idx, { url });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingIdx(null);
    }
  };

  const renderBlockEditor = (block, idx) => {
    const common = (
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">{BLOCK_TYPES.find(b => b.type === block.type)?.label}</span>
        <div className="flex-1" />
        <button onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
        <button onClick={() => moveBlock(idx, 1)} disabled={idx === blocks.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
        <button onClick={() => deleteBlock(idx)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );

    switch (block.type) {
      case 'text':
        return (
          <div>
            {common}
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(idx, { content: e.target.value })}
              rows={6}
              placeholder="## Heading&#10;&#10;Paragraph with **bold** and $math$."
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm font-mono focus:border-red-500 focus:outline-none resize-y"
            />
          </div>
        );

      case 'callout':
        return (
          <div className="space-y-2">
            {common}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={block.variant}
                onChange={(e) => updateBlock(idx, { variant: e.target.value })}
                className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none"
              >
                {VARIANTS.map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
              </select>
              <input
                value={block.title}
                onChange={(e) => updateBlock(idx, { title: e.target.value })}
                placeholder="Title"
                className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(idx, { content: e.target.value })}
              rows={3}
              placeholder="Callout content (Markdown + KaTeX supported)"
              className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {common}
            <div className="flex gap-2">
              <input
                value={block.url}
                onChange={(e) => updateBlock(idx, { url: e.target.value })}
                placeholder="Image URL"
                className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingIdx === idx}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-none flex items-center gap-1.5 disabled:opacity-50"
              >
                {uploadingIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageUpload(idx, e.target.files[0]);
                  e.target.value = '';
                }}
              />
            </div>
            {block.url && <img src={block.url} alt="preview" className="max-h-24 rounded-none border border-gray-800" />}
            <input value={block.caption} onChange={(e) => updateBlock(idx, { caption: e.target.value })} placeholder="Caption" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            <input value={block.alt} onChange={(e) => updateBlock(idx, { alt: e.target.value })} placeholder="Alt text (accessibility)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            {common}
            <input value={block.url} onChange={(e) => updateBlock(idx, { url: e.target.value })} placeholder="YouTube or video URL" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" value={block.start ?? ''} onChange={(e) => updateBlock(idx, { start: e.target.value ? parseInt(e.target.value) : null })} placeholder="Start (sec)" className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
              <input type="number" value={block.end ?? ''} onChange={(e) => updateBlock(idx, { end: e.target.value ? parseInt(e.target.value) : null })} placeholder="End (sec)" className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
              <input value={block.caption} onChange={(e) => updateBlock(idx, { caption: e.target.value })} placeholder="Caption" className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            </div>
          </div>
        );

      case 'worked_example':
        return (
          <div className="space-y-2">
            {common}
            <input value={block.title} onChange={(e) => updateBlock(idx, { title: e.target.value })} placeholder="Example title" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            {block.steps.map((step, sIdx) => (
              <div key={sIdx} className="flex gap-2 items-start">
                <span className="text-gray-500 text-xs mt-2">{sIdx + 1}.</span>
                <input value={step.label} onChange={(e) => {
                  const steps = [...block.steps];
                  steps[sIdx] = { ...steps[sIdx], label: e.target.value };
                  updateBlock(idx, { steps });
                }} placeholder="Step label" className="w-32 px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
                <textarea value={step.content} onChange={(e) => {
                  const steps = [...block.steps];
                  steps[sIdx] = { ...steps[sIdx], content: e.target.value };
                  updateBlock(idx, { steps });
                }} placeholder="Step content (Markdown + KaTeX)" rows={2} className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y" />
                <button onClick={() => updateBlock(idx, { steps: block.steps.filter((_, i) => i !== sIdx) })} className="p-1 text-gray-500 hover:text-red-400 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(idx, { steps: [...block.steps, { label: '', content: '' }] })} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Step</button>
          </div>
        );

      case 'inline_exercise':
        return (
          <div className="space-y-2">
            {common}
            <select value={block.exercise_type} onChange={(e) => updateBlock(idx, { exercise_type: e.target.value })} className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none">
              {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <textarea value={block.question} onChange={(e) => updateBlock(idx, { question: e.target.value })} rows={2} placeholder="Question (Markdown + KaTeX)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y" />
            {block.exercise_type === 'multiple_choice' && (
              <textarea value={Array.isArray(block.options) ? block.options.join('\n') : ''} onChange={(e) => updateBlock(idx, { options: e.target.value.split('\n').filter(Boolean) })} rows={3} placeholder="Options (one per line)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y" />
            )}
            <input value={block.correct_answer} onChange={(e) => updateBlock(idx, { correct_answer: e.target.value })} placeholder="Correct answer" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            <textarea value={block.hint} onChange={(e) => updateBlock(idx, { hint: e.target.value })} rows={2} placeholder="Hint (optional)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y" />
            <textarea value={block.explanation} onChange={(e) => updateBlock(idx, { explanation: e.target.value })} rows={2} placeholder="Explanation (shown after answer)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none resize-y" />
          </div>
        );

      case 'code_sandbox':
        return (
          <div className="space-y-2">
            {common}
            <select value={block.language} onChange={(e) => updateBlock(idx, { language: e.target.value })} className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none">
              {CODE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <textarea value={block.starter_code} onChange={(e) => updateBlock(idx, { starter_code: e.target.value })} rows={4} placeholder="Starter code" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm font-mono focus:border-red-500 focus:outline-none resize-y" />
            <textarea value={block.solution} onChange={(e) => updateBlock(idx, { solution: e.target.value })} rows={3} placeholder="Solution (shown when revealed)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm font-mono focus:border-red-500 focus:outline-none resize-y" />
            <input value={block.instructions} onChange={(e) => updateBlock(idx, { instructions: e.target.value })} placeholder="Instructions for student" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
          </div>
        );

      case 'interactive_widget':
        return (
          <div className="space-y-2">
            {common}
            <select value={block.widget_type} onChange={(e) => updateBlock(idx, { widget_type: e.target.value })} className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none">
              {WIDGET_TYPES.map(w => <option key={w} value={w}>{w.replace('_', ' ')}</option>)}
            </select>
            <textarea value={JSON.stringify(block.config || {}, null, 2)} onChange={(e) => {
              try { updateBlock(idx, { config: JSON.parse(e.target.value) }); } catch {}
            }} rows={6} placeholder='{"default_angle": 45, "default_velocity": 30}' className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm font-mono focus:border-red-500 focus:outline-none resize-y" />
            <p className="text-gray-500 text-xs">Edit config as JSON. Each widget type has different parameters.</p>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-2">
            {common}
            {block.points.map((pt, pIdx) => (
              <div key={pIdx} className="flex gap-2">
                <input value={pt} onChange={(e) => {
                  const points = [...block.points];
                  points[pIdx] = e.target.value;
                  updateBlock(idx, { points });
                }} placeholder={`Takeaway ${pIdx + 1}`} className="flex-1 px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
                <button onClick={() => updateBlock(idx, { points: block.points.filter((_, i) => i !== pIdx) })} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(idx, { points: [...block.points, ''] })} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Point</button>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-2">
            {common}
            <input value={block.label} onChange={(e) => updateBlock(idx, { label: e.target.value })} placeholder="Divider label (optional)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            {common}
            <div className="flex gap-1 mb-1">
              {block.headers.map((h, hIdx) => (
                <input key={hIdx} value={h} onChange={(e) => {
                  const headers = [...block.headers];
                  headers[hIdx] = e.target.value;
                  updateBlock(idx, { headers });
                }} placeholder={`Col ${hIdx + 1}`} className="flex-1 px-2 py-1.5 bg-black/50 border border-gray-700 rounded text-white text-sm focus:border-red-500 focus:outline-none" />
              ))}
              <button onClick={() => {
                const headers = [...block.headers, ''];
                const rows = block.rows.map(r => [...r, '']);
                updateBlock(idx, { headers, rows });
              }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded"><Plus className="w-3 h-3" /></button>
              <button onClick={() => {
                if (block.headers.length <= 1) return;
                const headers = block.headers.slice(0, -1);
                const rows = block.rows.map(r => r.slice(0, -1));
                updateBlock(idx, { headers, rows });
              }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded"><Minus className="w-3 h-3" /></button>
            </div>
            {block.rows.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1 items-center">
                {row.map((cell, cIdx) => (
                  <input key={cIdx} value={cell} onChange={(e) => {
                    const rows = [...block.rows];
                    rows[rIdx] = [...rows[rIdx]];
                    rows[rIdx][cIdx] = e.target.value;
                    updateBlock(idx, { rows });
                  }} className="flex-1 px-2 py-1.5 bg-black/50 border border-gray-700 rounded text-white text-sm focus:border-red-500 focus:outline-none" />
                ))}
                <button onClick={() => updateBlock(idx, { rows: block.rows.filter((_, i) => i !== rIdx) })} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(idx, { rows: [...block.rows, Array(block.headers.length).fill('')] })} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Row</button>
            <input value={block.caption} onChange={(e) => updateBlock(idx, { caption: e.target.value })} placeholder="Table caption" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
          </div>
        );

      case 'embed':
        return (
          <div className="space-y-2">
            {common}
            <input value={block.url} onChange={(e) => updateBlock(idx, { url: e.target.value })} placeholder="Embed URL (Desmos, GeoGebra, etc.)" className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={block.caption} onChange={(e) => updateBlock(idx, { caption: e.target.value })} placeholder="Caption" className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
              <input value={block.aspect_ratio} onChange={(e) => updateBlock(idx, { aspect_ratio: e.target.value })} placeholder="Aspect ratio (16/9)" className="px-3 py-2 bg-black/50 border border-gray-700 rounded-none text-white text-sm focus:border-red-500 focus:outline-none" />
            </div>
          </div>
        );

      default:
        return <div className="text-yellow-300 text-sm">Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-none transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-none transition-colors ${
            previewMode ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {previewMode ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Content */}
      {previewMode ? (
        <div className="bg-black/20 rounded-none border border-gray-800 p-4">
          {blocks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">No blocks to preview</p>
          ) : (
            <BlockRenderer blocks={blocks} />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-none">
              <p className="text-gray-500 text-sm">No blocks yet. Click a block type above to add one.</p>
            </div>
          )}
          {blocks.map((block, idx) => (
            <div key={idx} className="bg-black/30 rounded-none border border-gray-800 p-3">
              {renderBlockEditor(block, idx)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockBuilder;
