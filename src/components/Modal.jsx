import { memo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal — generic accessible modal wrapper
 * Props: isOpen, onClose, title, children, maxWidth
 */
const Modal = memo(function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content animate-scale-in" style={{ maxWidth }}>
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="text-lg font-bold text-white text-display">
              {title}
            </h2>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              aria-label="Close modal"
            >
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
});

export default Modal;
