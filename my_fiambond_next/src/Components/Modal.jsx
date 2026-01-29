'use client'; 

import { useEffect } from 'react';

// Reusable Modal Component with a clear, tinted background
export default function Modal({ isOpen, onClose, title, children }) {
  
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; 
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; 
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      // ⭐️ FIX: bg-black/30 provides a light dark tint (30% darkness)
      // ⭐️ REMOVED: backdrop-blur to keep the website behind perfectly sharp
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4"
      onClick={onClose} 
    >
      <div 
        // White modal with a strong shadow to make it stand out against the sharp background
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold px-2"
          >
            &times;
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}