import type { ReactNode } from "react";

interface PaginationProps {
  total: number;
  perPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  total,
  perPage,
  currentPage,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const range = 2;
  for (let i = 1; i <= totalPages; i += 1) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    }
  }

  const pageItems: ReactNode[] = [];
  let prevPage = 0;
  pages.forEach((page) => {
    if (prevPage && page - prevPage > 1) {
      pageItems.push(
        <span className="info" key={`gap-${page}`}>
          ...
        </span>,
      );
    }
    pageItems.push(
      <button
        type="button"
        key={page}
        className={page === currentPage ? "active" : ""}
        onClick={() => onPageChange(page)}
      >
        {page}
      </button>,
    );
    prevPage = page;
  });

  return (
    <div className="pagination">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ◀
      </button>
      {pageItems}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        ▶
      </button>
      <span className="info">{total.toLocaleString()} tags</span>
    </div>
  );
};
