import { useState, useMemo, useEffect } from 'react';

/**
 * Custom Hook for managing client-side pagination
 *
 * @param {Object} options
 * @param {Array} options.items - Array data yang telah difilter
 * @param {number} [options.initialPageSize=10] - Jumlah item per halaman awal
 * @param {Array} [options.resetDeps=[]] - Array dependensi filter yang jika berubah akan mereset halaman ke 1
 * @returns {Object} State dan helper pagination
 */
export const usePagination = ({
  items = [],
  initialPageSize = 10,
  resetDeps = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items ? items.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 whenever any filter dependency changes
  useEffect(() => {
    setCurrentPage(1);
  }, resetDeps); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-clamp current page if items shrink and current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Sliced items for current page
  const paginatedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize, totalPages]);

  const handlePageChange = (page) => {
    const validPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(validPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return {
    currentPage,
    setCurrentPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    paginatedItems,
    totalPages,
    totalItems,
    handlePageChange,
    handlePageSizeChange,
  };
};

export default usePagination;
