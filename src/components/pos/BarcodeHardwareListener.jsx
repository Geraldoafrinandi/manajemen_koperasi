import { useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';

export const BarcodeHardwareListener = () => {
  const { addItemByBarcode } = useCart();
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());
  const lastScanTimeRef = useRef(0);
  const lastScannedBarcodeRef = useRef('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused =
        activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Jeda antar keystroke scanner fisik biasanya < 50ms, jika jeda > 150ms reset buffer
      if (timeDiff > 150 && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const barcodeScanned = bufferRef.current.trim();
          bufferRef.current = '';
          
          // Hentikan default action dan cegah event Enter merambat ke shortcut POS / Form lain
          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
          }

          const now = Date.now();
          // Proteksi Double-Scan: Jika barcode sama persis dibaca dalam waktu < 750ms, abaikan (mencegah double trigger hardware)
          if (
            barcodeScanned === lastScannedBarcodeRef.current &&
            now - lastScanTimeRef.current < 750
          ) {
            return;
          }

          // Throttle umum antrian scan (< 250ms)
          if (now - lastScanTimeRef.current < 250) {
            return;
          }

          lastScanTimeRef.current = now;
          lastScannedBarcodeRef.current = barcodeScanned;

          addItemByBarcode(barcodeScanned);
        } else {
          bufferRef.current = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Hanya rekam karakter jika kursor TIDAK sedang mengetik di dalam input/textarea
        if (!isInputFocused) {
          bufferRef.current += e.key;
        }
      }
    };

    // Gunakan capture phase (true) agar barcode scanner tertangkap lebih dulu sebelum listener komponen lain
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [addItemByBarcode]);

  return null;
};

export default BarcodeHardwareListener;
