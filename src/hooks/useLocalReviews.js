import { useState, useCallback } from 'react';

const STORAGE_KEY = 'marxist_book_reviews';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLocalReviews(bookId) {
  const [reviews, setReviews] = useState(() => {
    const all = readAll();
    return all[bookId] || [];
  });

  const addReview = useCallback((rating, text) => {
    const all = readAll();
    const bookReviews = all[bookId] || [];
    const newReview = {
      id: Date.now().toString(),
      rating: Math.max(1, Math.min(5, rating)),
      text: text.trim(),
      date: new Date().toISOString(),
    };
    bookReviews.unshift(newReview);
    all[bookId] = bookReviews;
    writeAll(all);
    setReviews([...bookReviews]);
    return newReview;
  }, [bookId]);

  const deleteReview = useCallback((reviewId) => {
    const all = readAll();
    const bookReviews = (all[bookId] || []).filter(r => r.id !== reviewId);
    all[bookId] = bookReviews;
    writeAll(all);
    setReviews([...bookReviews]);
  }, [bookId]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return { reviews, addReview, deleteReview, averageRating, reviewCount: reviews.length };
}

export function getAverageRatingForBook(bookId) {
  const all = readAll();
  const reviews = all[bookId] || [];
  if (reviews.length === 0) return { average: 0, count: 0 };
  return {
    average: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
    count: reviews.length,
  };
}
