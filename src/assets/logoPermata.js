export const PERMATA_EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect x="15" y="15" width="70" height="70" rx="4" stroke="#065f46" stroke-width="7" fill="#ffffff" />
  <rect x="15" y="15" width="70" height="70" rx="4" transform="rotate(45 50 50)" stroke="#047857" stroke-width="7" fill="#ffffff" />
  <polygon points="50,22 58,36 74,36 62,46 68,62 50,52 32,62 38,46 26,36 42,36" fill="#047857" opacity="0.25" />
  <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#065f46" stroke-width="2.5" />
  <circle cx="50" cy="40" r="2.8" fill="#0284c7" />
  <circle cx="58" cy="44" r="2.8" fill="#e11d48" />
  <circle cx="60" cy="52" r="2.8" fill="#f59e0b" />
  <circle cx="56" cy="60" r="2.8" fill="#16a34a" />
  <circle cx="44" cy="60" r="2.8" fill="#9333ea" />
  <circle cx="40" cy="52" r="2.8" fill="#0d9488" />
  <circle cx="42" cy="44" r="2.8" fill="#ea580c" />
  <circle cx="50" cy="50" r="3.5" fill="#065f46" />
</svg>`;

export const drawOfficialPermataLogo = (doc, x, y, size = 20) => {
  const cx = x + size / 2;
  const cy = y + size / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(6, 95, 70);
  doc.setLineWidth(0.6);

  const sqSize = size * 0.72;
  const halfSq = sqSize / 2;
  doc.roundedRect(cx - halfSq, cy - halfSq, sqSize, sqSize, 1.0, 1.0, 'FD');

  const d = halfSq * 1.414;
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.6);
  doc.lines(
    [
      [d, d],
      [-d, d],
      [-d, -d],
      [d, -d],
    ],
    cx,
    cy - d,
    [1, 1],
    'FD',
    true
  );

  doc.setFillColor(209, 250, 229);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.2);
  doc.circle(cx, cy, size * 0.22, 'FD');

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(6, 95, 70);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, size * 0.15, 'FD');

  const nodeDist = size * 0.11;
  const nodeRadius = 0.45;
  const colorNodes = [
    [2, 132, 199],
    [225, 29, 72],
    [245, 158, 11],
    [22, 163, 74],
    [147, 51, 234],
    [13, 148, 136],
    [234, 88, 12],
    [4, 120, 87],
  ];

  for (let i = 0; i < 8; i++) {
    const angle = ((i * 45 - 90) * Math.PI) / 180;
    const nx = cx + Math.cos(angle) * nodeDist;
    const ny = cy + Math.sin(angle) * nodeDist;
    doc.setFillColor(colorNodes[i][0], colorNodes[i][1], colorNodes[i][2]);
    doc.circle(nx, ny, nodeRadius, 'F');
  }

  doc.setFillColor(6, 95, 70);
  doc.circle(cx, cy, 0.6, 'F');
};

export default drawOfficialPermataLogo;
