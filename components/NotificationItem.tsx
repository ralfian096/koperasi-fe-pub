
import React, { useState, useEffect } from 'react';

interface NotificationItemProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const icons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const styles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    icon: 'text-green-500',
    text: 'text-green-800',
    message: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    icon: 'text-red-500',
    text: 'text-red-800',
    message: 'text-red-700',
  },
  info: {
     bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon: 'text-blue-500',
    text: 'text-blue-800',
    message: 'text-blue-700',
  },
};

const NotificationItem: React.FC<NotificationItemProps> = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setShow(true);

    // Set timers to animate out and then remove
    const timer1 = setTimeout(() => {
        handleClose();
    }, 3000); // Notification visible for 3 seconds

    return () => {
      clearTimeout(timer1);
    };
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 300); // Duration of the exit animation
  };

  const style = styles[type];
  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div
      className={`
        w-full p-4 rounded-lg shadow-lg border-l-4
        ${style.bg} ${style.border}
        transition-all duration-300 ease-in-out
        ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      role="alert"
    >
      <div className="flex">
        <div className={`flex-shrink-0 ${style.icon}`}>
          {icons[type]}
        </div>
        <div className="ml-3">
          <p className={`font-bold text-sm ${style.text}`}>{title}</p>
          <p className={`mt-1 text-sm ${style.message}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.bg} ${style.text} hover:opacity-80`}
            >
              <span className="sr-only">Dismiss</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
