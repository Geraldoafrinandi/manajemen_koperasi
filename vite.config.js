import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In-memory cross-device barcode request sync store for Vite dev server
const syncedBarcodeRequests = new Map();

function barcodeRequestsSyncPlugin() {
  return {
    name: 'barcode-requests-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url === '/api/barcode-requests' || url.startsWith('/api/barcode-requests?') || url.startsWith('/api/barcode-requests/')) {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: Array.from(syncedBarcodeRequests.values()) }));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const barcode = String(data.barcode || '').trim();
                if (barcode) {
                  const reqItem = {
                    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    barcode: barcode,
                    cashierName: data.cashierName || 'Petugas Kasir',
                    cashierId: data.cashierId || null,
                    requestedAt: new Date().toISOString(),
                    status: 'pending',
                  };
                  syncedBarcodeRequests.set(barcode, reqItem);
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, data: Array.from(syncedBarcodeRequests.values()) }));
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: e.message }));
              }
            });
            return;
          }
          if (req.method === 'DELETE') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost');
                const queryBarcode = parsedUrl.searchParams.get('barcode');
                const queryId = parsedUrl.searchParams.get('id');

                let data = {};
                if (body) {
                  try {
                    data = JSON.parse(body);
                  } catch (err) {}
                }

                const barcode = String(queryBarcode || data.barcode || '').trim();
                const id = String(queryId || data.id || '').trim();

                if (barcode) {
                  syncedBarcodeRequests.delete(barcode);
                }
                if (id) {
                  syncedBarcodeRequests.delete(id);
                  for (const [k, v] of syncedBarcodeRequests.entries()) {
                    if (v.id === id || v.barcode === id) syncedBarcodeRequests.delete(k);
                  }
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, data: Array.from(syncedBarcodeRequests.values()) }));
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), barcodeRequestsSyncPlugin()],
  server: {
    host: true, // Izinkan akses dari HP via IP lokal (misal: http://192.168.x.x:5173)
    port: 5173,
    allowedHosts: true, // Izinkan akses melalui tunnel (localhost.run, localtunnel, ngrok, dll)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});