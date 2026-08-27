// Pure JavaScript Code128 Barcode SVG / Canvas Generator (Zero Dependencies)

// Code 128B pattern table (107 patterns)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'                                 // 100-106 (106 = Stop)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encode string text into Code128 sequence of bar widths
 * @param {string} text 
 * @returns {string} String of alternating bar/space widths (e.g. "212222...")
 */
export const encodeCode128 = (text) => {
  if (!text) text = '000000000';
  const cleanText = String(text).replace(/[^\x20-\x7E]/g, ''); // ASCII 32-126
  
  const codes = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i) - 32;
    codes.push(charCode);
    checksum += charCode * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(STOP_CODE);

  let patternStr = '';
  for (const code of codes) {
    patternStr += CODE128_PATTERNS[code] || '111111';
  }

  return patternStr;
};

/**
 * Generate SVG Path or Rects data for rendering 1D barcode in React / HTML
 * @param {string} text 
 * @param {number} barWidth 
 * @param {number} height 
 * @returns {{ rects: Array<{x: number, width: number, height: number}>, totalWidth: number }}
 */
export const getBarcodeRects = (text, barWidth = 2, height = 50) => {
  const pattern = encodeCode128(text);
  const rects = [];
  let currentX = 10; // Left quiet zone padding

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * barWidth;
    const isBar = i % 2 === 0;
    if (isBar) {
      rects.push({
        x: currentX,
        width: width,
        height: height,
      });
    }
    currentX += width;
  }

  return {
    rects,
    totalWidth: currentX + 10, // Right quiet zone padding
    height: height,
  };
};

/**
 * React Component to render crisp vector SVG Barcode
 */
export const BarcodeSvg = ({
  value,
  barWidth = 1.8,
  height = 45,
  showText = true,
  className = '',
}) => {
  const { rects, totalWidth } = getBarcodeRects(value || '00000000', barWidth, height);
  const totalSvgHeight = showText ? height + 16 : height;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalSvgHeight}`}
        className="max-w-full h-auto"
        style={{ width: `${totalWidth}px`, height: `${totalSvgHeight}px` }}
      >
        <rect width={totalWidth} height={totalSvgHeight} fill="#FFFFFF" />
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={2}
            width={r.width}
            height={r.height}
            fill="#000000"
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 13}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="2"
            fill="#000000"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
};

/**
 * Generate raw SVG string of Barcode (for isolated print iframes/windows)
 */
export const getBarcodeSvgString = (value, barWidth = 1.6, height = 40, showText = true) => {
  const { rects, totalWidth } = getBarcodeRects(value || '00000000', barWidth, height);
  const totalSvgHeight = showText ? height + 16 : height;
  const rectsMarkup = rects
    .map((r) => `<rect x="${r.x}" y="2" width="${r.width}" height="${r.height}" fill="#000000" />`)
    .join('');
  const textMarkup = showText
    ? `<text x="${totalWidth / 2}" y="${height + 13}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="1" fill="#000000">${value || ''}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalSvgHeight}" width="${totalWidth}" height="${totalSvgHeight}" style="max-width: 100%; height: auto;"><rect width="${totalWidth}" height="${totalSvgHeight}" fill="#FFFFFF" />${rectsMarkup}${textMarkup}</svg>`;
};

export default BarcodeSvg;
