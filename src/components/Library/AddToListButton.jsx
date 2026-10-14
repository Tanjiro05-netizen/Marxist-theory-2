import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPlus, Check, Plus } from 'lucide-react';
import { useReadingLists } from '../../hooks/useReadingLists';

/* Colors ride the global theme tokens (theme.css) so the dropdown follows
   light/dark instead of the old hardcoded dark palette. */
const inkSurface = 'var(--ink-2, #10131b)';
const hairline = 'var(--line, #262a35)';
const textDim = 'var(--paper-dim, #a5a194)';
const textFaint = 'var(--paper-faint, #6f6c61)';
const redText = 'var(--red-bright, #c11730)';

const AddToListButton = ({ bookId }) => {
  const { t } = useTranslation();
  const { lists, createList, addBookToList, removeBookFromList, getListsForBook } = useReadingLists();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleInteraction = (e) => {
      // Outside click or Escape closes; Escape is the keyboard-friendly route.
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      if (e.type === 'mousedown' && ref.current && ref.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [open]);

  const bookLists = getListsForBook(bookId);
  const isInList = (listId) => bookLists.some(l => l.id === listId);

  const handleToggle = (listId) => {
    if (isInList(listId)) {
      removeBookFromList(listId, bookId);
    } else {
      addBookToList(listId, bookId);
    }
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const list = createList(newName);
    addBookToList(list.id, bookId);
    setNewName('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('library.addToList')}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          minHeight: '44px', minWidth: '44px', padding: '10px 14px', fontSize: '11px',
          background: bookLists.length > 0 ? 'rgba(179, 18, 46,0.12)' : 'rgba(127,127,127,0.08)',
          border: `1px solid ${bookLists.length > 0 ? 'rgba(179, 18, 46,0.25)' : 'rgba(127,127,127,0.16)'}`,
          borderRadius: '6px',
          color: bookLists.length > 0 ? redText : textDim,
          cursor: 'pointer', transition: 'all 120ms',
        }}
        title={t('library.addToList')}
      >
        <ListPlus size={14} />
      </button>

      {open && (
        <div role="menu" style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '4px',
          background: inkSurface, border: `1px solid ${hairline}`,
          borderRadius: '10px', padding: '6px', minWidth: '200px',
          zIndex: 9999, boxShadow: '0 14px 36px rgba(0,0,0,0.45)',
        }}>
          <div style={{ padding: '4px 8px 6px', fontSize: '11px', color: textFaint, fontWeight: 600 }}>
            {t('library.addToList')}
            <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: 400, color: textFaint }}>
              {t('library.localListsNote')}
            </div>
          </div>

          {lists.length === 0 && (
            <div style={{ padding: '6px 8px', fontSize: '11px', color: textFaint }}>
              {t('library.noLists')}
            </div>
          )}

          {lists.map(list => (
            <button
              key={list.id}
              role="menuitemcheckbox"
              aria-checked={isInList(list.id)}
              onClick={() => handleToggle(list.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                width: '100%', minHeight: '40px', padding: '10px 8px', background: 'none', border: 'none',
                color: isInList(list.id) ? redText : textDim,
                fontSize: '12.5px', cursor: 'pointer', borderRadius: '5px',
                textAlign: 'left', transition: 'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,127,127,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {list.name}
              </span>
              {isInList(list.id) && <Check size={13} />}
            </button>
          ))}

          <div style={{
            borderTop: `1px solid ${hairline}`,
            marginTop: '4px', paddingTop: '4px',
            display: 'flex', gap: '4px', alignItems: 'center',
          }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder={t('library.listName')}
              style={{
                flex: 1, minHeight: '40px', padding: '6px 8px',
                /* 16px keeps iOS Safari from zooming the page on focus */
                fontSize: '16px',
                background: 'rgba(0,0,0,0.35)', border: `1px solid ${hairline}`,
                borderRadius: '4px', color: textDim, outline: 'none',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              aria-label={t('library.createAndAddToList')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '40px', minWidth: '40px', padding: '6px',
                background: newName.trim() ? 'rgba(179, 18, 46,0.2)' : 'rgba(127,127,127,0.06)',
                border: 'none', borderRadius: '4px',
                color: newName.trim() ? redText : textFaint,
                cursor: newName.trim() ? 'pointer' : 'default',
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToListButton;
