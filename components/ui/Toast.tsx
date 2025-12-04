
import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircleIcon, ExclamationIcon, XCircleIcon } from '../icons/Icons';

export const Toast: React.FC<{ toast: ToastMessage, onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const icons = {
        success: <CheckCircleIcon className="w-6 h-6 text-success" />,
        error: <XCircleIcon className="w-6 h-6 text-danger" />,
        warning: <ExclamationIcon className="w-6 h-6 text-warning" />,
    };

    const colors = {
        success: 'border-success',
        error: 'border-danger',
        warning: 'border-warning',
    }

    return (
        <div className={`max-w-sm w-full bg-panel shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${colors[toast.type]}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {icons[toast.type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-text">
                            {toast.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => onDismiss(toast.id)} className="inline-flex text-muted hover:text-text focus:outline-none">
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const Toaster: React.FC<{ toasts: ToastMessage[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[110]">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </div>
    );
};
