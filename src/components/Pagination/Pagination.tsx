// File: src/components/Pagination/Pagination.tsx

import React from 'react';
import { Theme } from '../../themes';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
  displayStart: number;
  displayEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
  disabled?: boolean;
  theme: Theme;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalRecords,
  displayStart,
  displayEnd,
  onPageChange,
  onPageSizeChange,
  hasNext,
  hasPrevious,
  disabled = false,
  theme,
}) => {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (!disabled) {
      onPageSizeChange(newSize);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${theme.pagination}`}
    >
      {/* Records info */}
      <div className={theme.paginationText}>
        Showing {displayStart}-{displayEnd} of {totalRecords.toLocaleString()} records
      </div>

      {/* Page size and navigation */}
      <div className="flex items-center gap-6">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className={theme.paginationText}>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            disabled={disabled}
            className={theme.select}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className={theme.paginationText}>entries</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || disabled}
            className={theme.paginationButton}
          >
            Previous
          </button>

          <span className={`${theme.paginationText} px-2`}>
            Page {currentPage} {totalPages > 0 && `of ${totalPages}`}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || disabled}
            className={theme.paginationButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
