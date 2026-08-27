import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import storageService from '../../services/storageService';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    storageService.resetToDefault();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-emerald-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-emerald-950">Terjadi Kesalahan Tampilan</h2>
            <p className="text-xs text-emerald-700">
              Ada data lokal yang tidak sinkron. Klik tombol di bawah untuk memulihkan sistem:
            </p>
            <p className="p-3 rounded-xl bg-emerald-50 text-[11px] font-mono text-emerald-900 overflow-x-auto text-left border border-emerald-200">
              {this.state.error?.toString() || 'Unknown Error'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Pulihkan & Muat Ulang Sistem</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
