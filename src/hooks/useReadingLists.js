import { useState, useCallback } from 'react';

const STORAGE_KEY = 'marxist_reading_lists';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useReadingLists() {
  const [lists, setLists] = useState(() => readAll());

  const refresh = useCallback(() => setLists(readAll()), []);

  const createList = useCallback((name) => {
    const all = readAll();
    const newList = {
      id: Date.now().toString(),
      name: name.trim(),
      bookIds: [],
      createdAt: new Date().toISOString(),
    };
    all.push(newList);
    writeAll(all);
    setLists([...all]);
    return newList;
  }, []);

  const deleteList = useCallback((listId) => {
    const all = readAll().filter(l => l.id !== listId);
    writeAll(all);
    setLists([...all]);
  }, []);

  const renameList = useCallback((listId, newName) => {
    const all = readAll();
    const list = all.find(l => l.id === listId);
    if (list) {
      list.name = newName.trim();
      writeAll(all);
      setLists([...all]);
    }
  }, []);

  const addBookToList = useCallback((listId, bookId) => {
    const all = readAll();
    const list = all.find(l => l.id === listId);
    if (list && !list.bookIds.includes(bookId)) {
      list.bookIds.push(bookId);
      writeAll(all);
      setLists([...all]);
    }
  }, []);

  const removeBookFromList = useCallback((listId, bookId) => {
    const all = readAll();
    const list = all.find(l => l.id === listId);
    if (list) {
      list.bookIds = list.bookIds.filter(id => id !== bookId);
      writeAll(all);
      setLists([...all]);
    }
  }, []);

  const getListsForBook = useCallback((bookId) => {
    return readAll().filter(l => l.bookIds.includes(bookId));
  }, []);

  return { lists, createList, deleteList, renameList, addBookToList, removeBookFromList, getListsForBook, refresh };
}
