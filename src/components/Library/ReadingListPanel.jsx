import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, Plus, BookOpen, ChevronRight } from 'lucide-react';
import { useReadingLists } from '../../hooks/useReadingLists';

const ReadingListPanel = ({ onClose, onNavigateToBook }) => {
  const { t } = useTranslation();
  const { lists, createList, deleteList, removeBookFromList } = useReadingLists();
  const [newName, setNewName] = useState('');
  const [expandedList, setExpandedList] = useState(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createList(newName);
    setNewName('');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '340px', maxWidth: '90vw',
      background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 10000, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>
          {t('library.readingLists')}
        </h2>
        <button
          onClick={onClose}
          style={{ padding: '4px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.36)',
        fontSize: '11px',
        lineHeight: 1.5,
      }}>
        {t('library.localListsNote')}
      </div>

      {/* Create new list */}
      <div style={{
        display: 'flex', gap: '6px', padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder={t('library.listName')}
          style={{
            flex: 1, padding: '6px 10px', fontSize: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px', color: 'rgba(255,255,255,0.8)', outline: 'none',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 10px', fontSize: '11px', fontWeight: 600,
            background: newName.trim() ? '#c81e1e' : 'rgba(255,255,255,0.04)',
            border: 'none', borderRadius: '6px',
            color: newName.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
            cursor: newName.trim() ? 'pointer' : 'default',
          }}
        >
          <Plus size={13} />
          {t('library.createList')}
        </button>
      </div>

      {/* Lists */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {lists.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'rgba(255,255,255,0.25)', fontSize: '13px',
          }}>
            <BookOpen size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p>{t('library.noLists')}</p>
          </div>
        ) : (
          lists.map(list => (
            <div key={list.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '8px', marginBottom: '6px', overflow: 'hidden',
            }}>
              {/* List header */}
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', cursor: 'pointer',
                }}
                onClick={() => setExpandedList(expandedList === list.id ? null : list.id)}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                    {list.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {list.bookIds.length} {t('library.booksInList')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                    style={{ padding: '3px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                    title={t('library.deleteList')}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight
                    size={14}
                    style={{
                      color: 'rgba(255,255,255,0.2)',
                      transform: expandedList === list.id ? 'rotate(90deg)' : 'none',
                      transition: 'transform 150ms',
                    }}
                  />
                </div>
              </div>

              {/* Expanded book list */}
              {expandedList === list.id && list.bookIds.length > 0 && (
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  padding: '4px 8px 8px',
                }}>
                  {list.bookIds.map(bId => (
                    <div key={bId} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 6px', borderRadius: '4px',
                    }}>
                      <button
                        onClick={() => onNavigateToBook && onNavigateToBook(bId)}
                        style={{
                          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                          fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                          textDecorationColor: 'rgba(255,255,255,0.15)',
                        }}
                      >
                        Book #{bId}
                      </button>
                      <button
                        onClick={() => removeBookFromList(list.id, bId)}
                        style={{
                          padding: '2px', background: 'none', border: 'none',
                          color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '10px',
                        }}
                        title={t('library.removeFromList')}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReadingListPanel;
