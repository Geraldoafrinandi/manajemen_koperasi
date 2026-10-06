import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';

let globalBuffer = '';
let globalLastKeyTime = Date.now();
let globalLastScanTime = 0;
let globalLastScannedBarcode = '';

export const BarcodeHardwareListener = () => {
  const { addItemByBarcode } = useCart();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused =
        activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      const currentTime = Date.now();
      const timeDiff = currentTime - globalLastKeyTime;
      globalLastKeyTime = currentTime;

      if (timeDiff > 150 && globalBuffer.length > 0) {
        globalBuffer = '';
      }

      if (e.key === 'Enter') {
        if (globalBuffer.length >= 3) {
          const barcodeScanned = globalBuffer.trim();
          globalBuffer = '';

          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
          }

          const now = Date.now();
          if (
            barcodeScanned === globalLastScannedBarcode &&
            now - globalLastScanTime < 2000
          ) {
            return;
          }
          if (now - globalLastScanTime < 250) {
            return;
          }

          // Simpan waktu dan barcode terakhir yang berhasil discan
          globalLastScanTime = now;
          globalLastScannedBarcode = barcodeScanned;

          // Masukkan ke keranjang
          addItemByBarcode(barcodeScanned);
        } else {
          globalBuffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Hanya tangkap karakter jika tidak sedang fokus di input text
        if (!isInputFocused) {
          globalBuffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [addItemByBarcode]);

  return null;
};

export default BarcodeHardwareListener;