import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPlus, Check, Plus } from 'lucide-react';
import { useReadingLists } from '../../hooks/useReadingLists';

const AddToListButton = ({ bookId }) => {
  const { t } = useTranslation();
  const { lists, createList, addBookToList, removeBookFromList, getListsForBook } = useReadingLists();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', fontSize: '11px',
          background: bookLists.length > 0 ? 'rgba(200,30,30,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${bookLists.length > 0 ? 'rgba(200,30,30,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '6px',
          color: bookLists.length > 0 ? '#f87171' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer', transition: 'all 120ms',
        }}
        title={t('library.addToList')}
      >
        <ListPlus size={13} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: '4px',
          background: '#111', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', padding: '6px', minWidth: '180px',
          zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '4px 8px 6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {t('library.addToList')}
            <div style={{ marginTop: '2px', fontSize: '10px', fontWeight: 400, color: 'rgba(255,255,255,0.28)' }}>
              {t('library.localListsNote')}
            </div>
          </div>

          {lists.length === 0 && (
            <div style={{ padding: '6px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
              {t('library.noLists')}
            </div>
          )}

          {lists.map(list => (
            <button
              key={list.id}
              onClick={() => handleToggle(list.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '5px 8px', background: 'none', border: 'none',
                color: isInList(list.id) ? '#f87171' : 'rgba(255,255,255,0.6)',
                fontSize: '12px', cursor: 'pointer', borderRadius: '5px',
                textAlign: 'left', transition: 'background 100ms',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.target.style.background = 'none'}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {list.name}
              </span>
              {isInList(list.id) && <Check size={12} />}
            </button>
          ))}

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginTop: '4px', paddingTop: '4px',
            display: 'flex', gap: '4px',
          }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder={t('library.listName')}
              style={{
                flex: 1, padding: '4px 6px', fontSize: '11px',
                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px', color: 'rgba(255,255,255,0.7)', outline: 'none',
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              aria-label={t('library.createAndAddToList')}
              style={{
                padding: '4px', background: newName.trim() ? 'rgba(200,30,30,0.2)' : 'rgba(255,255,255,0.04)',
                border: 'none', borderRadius: '4px',
                color: newName.trim() ? '#f87171' : 'rgba(255,255,255,0.2)',
                cursor: newName.trim() ? 'pointer' : 'default',
              }}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddToListButton;
