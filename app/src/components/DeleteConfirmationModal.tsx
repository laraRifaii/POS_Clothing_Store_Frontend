// src/renderer/components/ToastConfirmation.tsx
import React from 'react';
import { toast, Id } from 'react-toastify';
import { Trash2 } from 'lucide-react';

interface ToastConfirmationProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  toastId: Id; // Pass the toast ID to dismiss only this toast
}

export const ToastConfirmation: React.FC<ToastConfirmationProps> = ({
  message,
  onConfirm,
  onCancel,
  toastId,
}) => {
  const handleConfirm = async () => {
    try {
      // First dismiss ONLY this confirmation toast
      toast.dismiss(toastId);
      
      // Then execute the action (which might show error toasts)
      await onConfirm();
    } catch (error) {
      // Error handling is done in the onConfirm function
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    toast.dismiss(toastId); // Dismiss only this toast
  };

  return (
    <div className="min-w-[400px] bg-white">
      <div className="flex items-center gap-4 pl-4 rounded-lg m-0">
        <div className="flex items-center">
          <div className="shrink-0 mr-4">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{message}</p>
            <p className="text-xs text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-0 min-w-[140px]">
          <button
            onClick={handleCancel}
            className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to show confirmation toast
export const showDeleteConfirmation = (
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: {
    onCancel?: () => void;
    autoClose?: number | false;
  },
) => {
  const toastId = toast(
    ({ toastProps }) => (
      <ToastConfirmation
        message={message}
        onConfirm={onConfirm}
        onCancel={options?.onCancel}
        toastId={toastProps.toastId}
      />
    ),
    {
      position: 'top-center',
      autoClose: options?.autoClose || false,
      closeButton: false,
      closeOnClick: false,
      draggable: false,
      pauseOnHover: true,
      hideProgressBar: true,
      className: 'p-0',
    },
  );

  return toastId;
};