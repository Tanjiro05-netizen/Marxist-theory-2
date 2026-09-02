import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-none shadow-none p-6 w-full max-w-md mx-4 border border-red-900/50">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-3" size={24} />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-none bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 rounded-none bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
