import React from 'react';
import Link from 'next/link';
import { Book, Clock } from 'lucide-react';

const BookCard = ({ book }) => {
    return (
        <Link href={`/reader/${book.id}`} className="block">
            <div className="bg-black/30 rounded-lg p-4 hover:bg-black/40 transition-colors group">
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-black/50">
                    {book.coverImage ? (
                        <img 
                            src={book.coverImage} 
                            alt={`Cover of ${book.title}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/books/default-cover.jpg';
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Book className="w-12 h-12 text-gray-600" />
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-400">{book.author}</p>
                    <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{book.year}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default BookCard;