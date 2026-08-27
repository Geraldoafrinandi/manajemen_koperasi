import { useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';

export const BarcodeHardwareListener = () => {
  const { addItemByBarcode } = useCart();
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInputFocused =
        activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (timeDiff > 100 && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const barcodeScanned = bufferRef.current;
          bufferRef.current = '';
          e.preventDefault();
          addItemByBarcode(barcodeScanned);
        } else {
          bufferRef.current = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isInputFocused) {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addItemByBarcode]);

  return null;
};

export default BarcodeHardwareListener;
