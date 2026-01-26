// src/renderer/components/ToastConfirmation.tsx
import React from 'react';
import { toast } from 'react-toastify';
import { Trash2, X } from 'lucide-react';

interface ToastConfirmationProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export const ToastConfirmation: React.FC<ToastConfirmationProps> = ({
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="min-w-[400px] bg-white">
      <div className="flex items-center gap-3 pl-4 rounded-lg m-0">
        <div className="flex items-center">
         
          <div>
            <p className="text-sm font-medium text-gray-900">{message}</p>
            <p className="text-xs text-gray-500">
              This action cannot be undone
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-5 min-w-[140px]">
          <button
            onClick={() => {
              onCancel?.();
              toast.dismiss();
            }}
            className="px-1 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onConfirm();
              toast.dismiss();
            }}
            className="px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to show confirmation toast
export const showConfirmModal = (
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: {
    onCancel?: () => void;
    autoClose?: number | false;
  },
) => {
  const toastId = toast(
    <ToastConfirmation
      message={message}
      onConfirm={onConfirm}
      onCancel={options?.onCancel}
    />,
    {
      position: 'top-center',
      autoClose: options?.autoClose || false, // Don't auto-close
      closeButton: false,
      closeOnClick: false,
      draggable: false,
      pauseOnHover: true,
      hideProgressBar: true,
      className: 'p-0',
      //   bodyClassName: 'p-0',
    },
  );

  return toastId;
};
