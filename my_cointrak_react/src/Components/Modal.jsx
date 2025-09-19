import { useEffect } from 'react';

// This is a reusable modal component
export default function Modal({ isOpen, onClose, title, children }) {
  // useEffect to handle the 'Escape' key to close the modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    // Cleanup function to remove the event listener
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // If the modal isn't open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    // The Modal Root: Fixed position, full screen, with a semi-transparent background
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose} // Clicking the background overlay closes the modal
    >
      {/* The Modal Content: Stop propagation to prevent clicks inside from closing it */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
        </div>
        
        {/* Modal Body: This is where the content will go. It's scrollable. */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}