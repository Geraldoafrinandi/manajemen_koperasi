import { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/**
 * Reusable Pagination Component
 *
 * @param {Object} props
 * @param {number} props.currentPage - Halaman aktif (1-indexed)
 * @param {number} props.totalItems - Total seluruh item data hasil filter
 * @param {number} props.pageSize - Jumlah item per halaman
 * @param {Function} props.onPageChange - Callback ketika halaman berubah (page: number) => void
 * @param {Function} [props.onPageSizeChange] - Callback opsional saat ukuran halaman diubah (size: number) => void
 * @param {number[]} [props.pageSizeOptions=[10, 25, 50, 100]] - Pilihan ukuran halaman
 * @param {string} [props.itemLabel="data"] - Label nama data (e.g. "barang", "transaksi", "produk")
 * @param {boolean} [props.compact=false] - Mode ringkas untuk modal atau area sempit
 * @param {string} [props.className=""] - Kelas CSS tambahan
 */
export const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'data',
  compact = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate pagination range with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      totalPages,
    ];
  }, [totalPages, safeCurrentPage]);

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== safeCurrentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handlePageSizeSelect = (e) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange && newSize > 0) {
      onPageSizeChange(newSize);
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 select-none ${className}`}
    >
      {/* Informasi Ringkasan Data & Pilihan Page Size */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left justify-center sm:justify-start w-full sm:w-auto">
        <p className="text-slate-600">
          Menampilkan{' '}
          <strong className="font-bold text-slate-900">{startItem}</strong> -{' '}
          <strong className="font-bold text-slate-900">{endItem}</strong> dari{' '}
          <strong className="font-bold text-slate-900">{totalItems}</strong> {itemLabel}
        </p>

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && !compact && (
          <div className="flex items-center space-x-1.5 pl-2 sm:border-l sm:border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Per hal:</span>
            <select
              value={pageSize}
              onChange={handlePageSizeSelect}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kontrol Navigasi Halaman */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1 justify-center w-full sm:w-auto">
          {/* First Page Button */}
          {!compact && (
            <button
              type="button"
              onClick={() => handlePageClick(1)}
              disabled={safeCurrentPage === 1}
              className={`p-1.5 rounded-lg border text-slate-600 transition-all ${
                safeCurrentPage === 1
                  ? 'border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                  : 'border-slate-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer shadow-2xs'
              }`}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            className={`p-1.5 rounded-lg border text-slate-600 transition-all ${
              safeCurrentPage === 1
                ? 'border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer shadow-2xs'
            }`}
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page Number Buttons */}
          <div className="flex items-center space-x-1 px-1">
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 font-bold text-xs"
                  >
                    ...
                  </span>
                );
              }

              const isActive = page === safeCurrentPage;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => handlePageClick(page)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/20'
                      : 'border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => handlePageClick(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            className={`p-1.5 rounded-lg border text-slate-600 transition-all ${
              safeCurrentPage === totalPages
                ? 'border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer shadow-2xs'
            }`}
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page Button */}
          {!compact && (
            <button
              type="button"
              onClick={() => handlePageClick(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className={`p-1.5 rounded-lg border text-slate-600 transition-all ${
                safeCurrentPage === totalPages
                  ? 'border-slate-200 text-slate-300 opacity-40 cursor-not-allowed'
                  : 'border-slate-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95 cursor-pointer shadow-2xs'
              }`}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Pagination;
