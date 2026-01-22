// src/hooks/useBarcodeScanner.ts
import { useEffect, useCallback, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  scanTimeout?: number;
  enabled?: boolean;
  pageActive?: boolean; // NEW: Control if page is active
}

export const useBarcodeScanner = ({
  onScan,
  minLength = 3,
  scanTimeout = 50, // Reduced from 100ms - scanners are VERY fast
  enabled = true,
  pageActive = true, // NEW
}: BarcodeScannerOptions) => {
  const barcodeBuffer = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // ✅ CRITICAL: Only work when both enabled AND page is active
    if (!enabled || !pageActive) return;
    
    // ✅ Prevent processing during async operations
    if (isProcessingRef.current) return;

    const currentTime = Date.now();
    const target = event.target as HTMLElement;
    
    // ✅ IMPROVED: Better input field detection
    const tagName = target.tagName.toUpperCase();
    const isInputField = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    const isBarcodeInput = target.classList.contains('barcode-input');
    const isSearchField = target.id === 'product-search' || 
                          target.getAttribute('data-search') === 'true' ||
                          target.getAttribute('placeholder')?.toLowerCase().includes('search') ||
                          target.getAttribute('placeholder')?.toLowerCase().includes('barcode') ||
                          target.getAttribute('placeholder')?.toLowerCase().includes('scan');
    
    // ✅ Allow scanning in designated barcode/search inputs, block in other inputs
    if (isInputField && !isBarcodeInput && !isSearchField) {
      return;
    }

    // ✅ CRITICAL: Detect scanner speed (scanners type < 30ms between characters)
    const timeSinceLastKey = currentTime - lastKeyTimeRef.current;
    const isRapidInput = timeSinceLastKey < 30 && timeSinceLastKey > 0;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // ✅ ENTER key - process barcode
    if (event.key === 'Enter') {
      if (barcodeBuffer.current.length >= minLength) {
        event.preventDefault();
        event.stopPropagation();
        
        isProcessingRef.current = true;
        const scannedCode = barcodeBuffer.current;
        barcodeBuffer.current = '';
        lastKeyTimeRef.current = 0;
        
        // Process barcode asynchronously
        Promise.resolve(onScan(scannedCode)).finally(() => {
          isProcessingRef.current = false;
        });
      }
      return;
    }

    // ✅ Process alphanumeric characters (barcode data)
    if (event.key.length === 1 && /[a-zA-Z0-9\-._]/.test(event.key)) {
      // Only prevent default if we're sure it's from a scanner
      if (isRapidInput || barcodeBuffer.current.length > 0) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      barcodeBuffer.current += event.key;
      lastKeyTimeRef.current = currentTime;

      // ✅ Auto-submit after scanner finishes (no Enter key from some scanners)
      timeoutRef.current = setTimeout(() => {
        if (barcodeBuffer.current.length >= minLength) {
          isProcessingRef.current = true;
          const scannedCode = barcodeBuffer.current;
          barcodeBuffer.current = '';
          lastKeyTimeRef.current = 0;
          
          Promise.resolve(onScan(scannedCode)).finally(() => {
            isProcessingRef.current = false;
          });
        } else {
          barcodeBuffer.current = '';
          lastKeyTimeRef.current = 0;
        }
      }, scanTimeout);
    } else {
      // Non-alphanumeric - reset buffer (user typing)
      barcodeBuffer.current = '';
      lastKeyTimeRef.current = 0;
    }
  }, [enabled, pageActive, minLength, scanTimeout, onScan]);

  useEffect(() => {
    if (enabled && pageActive) {
      // Use capture phase for priority handling
      window.addEventListener('keydown', handleKeyPress, true);
      
      return () => {
        window.removeEventListener('keydown', handleKeyPress, true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        barcodeBuffer.current = '';
        isProcessingRef.current = false;
      };
    }
  }, [enabled, pageActive, handleKeyPress]);

  const reset = () => {
    barcodeBuffer.current = '';
    lastKeyTimeRef.current = 0;
    isProcessingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return { reset };
};