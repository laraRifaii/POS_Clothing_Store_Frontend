import React from 'react';
import { Scan } from 'lucide-react';

interface BarcodeScannerIndicatorProps {
  enabled: boolean;
  onToggle: () => void;
}

export const BarcodeScannerIndicator: React.FC<BarcodeScannerIndicatorProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-4 right-4 p-4 rounded-full shadow-lg transition-all ${
        enabled 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
      }`}
      title={enabled ? 'Barcode Scanner: ON' : 'Barcode Scanner: OFF'}
    >
      <Scan size={24} />
      {enabled && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      )}
    </button>
  );
};