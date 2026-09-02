import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Trash2 } from 'lucide-react';
import { useLocalReviews } from '../../hooks/useLocalReviews';

const StarRating = ({ rating, onRate, interactive = false, size = 16 }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map(star => (
      <Star
        key={star}
        size={size}
        fill={star <= rating ? '#c8860a' : 'transparent'}
        color={star <= rating ? '#c8860a' : 'rgba(255,255,255,0.2)'}
        style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 120ms' }}
        onClick={() => interactive && onRate && onRate(star)}
      />
    ))}
  </div>
);

const BookReviewSection = ({ bookId, canWrite = false }) => {
  const { t } = useTranslation();
  const { reviews, addReview, deleteReview, averageRating, reviewCount } = useLocalReviews(bookId);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (newRating === 0) return;
    addReview(newRating, newText);
    setNewRating(0);
    setNewText('');
    setShowForm(false);
  };

  const visibleReviews = canWrite ? reviews : [];
  const visibleReviewCount = canWrite ? reviewCount : 0;
  const visibleAverageRating = canWrite ? averageRating : 0;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {t('library.reviews')}
          </h3>
          {visibleReviewCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StarRating rating={Math.round(visibleAverageRating)} size={12} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {visibleAverageRating.toFixed(1)} ({visibleReviewCount})
              </span>
            </div>
          )}
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '4px 10px', fontSize: '11px',
              background: 'rgba(179, 18, 46,0.15)', border: '1px solid rgba(179, 18, 46,0.3)',
              borderRadius: '6px', color: '#d41f3d', cursor: 'pointer',
            }}
          >
            {t('library.writeReview')}
          </button>
        )}
      </div>

      {/* New review form */}
      {canWrite && showForm && (
        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
          padding: '12px', marginBottom: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ marginBottom: '8px' }}>
            <StarRating rating={newRating} onRate={setNewRating} interactive size={20} />
          </div>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={t('library.writeReview') + '...'}
            style={{
              width: '100%', minHeight: '60px', padding: '8px',
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', color: 'rgba(255,255,255,0.8)', fontSize: '12px',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleSubmit}
              disabled={newRating === 0}
              style={{
                padding: '5px 14px', fontSize: '11px', fontWeight: 600,
                background: newRating === 0 ? 'rgba(255,255,255,0.06)' : '#b3122e',
                border: 'none', borderRadius: '6px',
                color: newRating === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: newRating === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {t('common.submit')}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewRating(0); setNewText(''); }}
              style={{
                padding: '5px 14px', fontSize: '11px',
                background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {visibleReviews.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          {t('library.noReviews')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visibleReviews.map(review => (
            <div key={review.id} style={{
              padding: '8px 10px', background: 'rgba(255,255,255,0.02)',
              borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <StarRating rating={review.rating} size={12} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteReview(review.id)}
                    style={{ padding: '2px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              {review.text && (
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                  {review.text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookReviewSection;
