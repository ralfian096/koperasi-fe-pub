import React, { useState, useEffect } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting: boolean;
}

const RejectionModal: React.FC<RejectionModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason(''); // Reset reason when modal opens
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md m-4 transform transition-all duration-300 ease-out scale-95 opacity-0 animate-scale-in">
        <div>
          <h3 className="mb-4 text-xl font-bold text-slate-800">Alasan Penolakan</h3>
          <p className="mb-4 text-slate-600 text-sm">
            Harap berikan alasan yang jelas mengapa pengajuan ini ditolak. Alasan akan terlihat oleh pengaju.
          </p>
          <div>
            <label htmlFor="rejection_reason" className="sr-only">Alasan Penolakan</label>
            <textarea
              id="rejection_reason"
              name="rejection_reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tulis alasan di sini..."
              disabled={isSubmitting}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Kirim Penolakan'}
          </button>
        </div>
      </div>
       <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RejectionModal;