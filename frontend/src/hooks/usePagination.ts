import { useState, useMemo } from "react";

export const usePagination = (backendPagination: any) => {
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo(() => {
    if (!backendPagination) return null;

    return {
      current_page: Number(backendPagination.current_page) || 1,
      last_page:
        Number(backendPagination.last_page) ||
        Number(backendPagination.total_pages) ||
        1,
      total: Number(backendPagination.total) || 0,
      from: Number(backendPagination.from) || 0,
      to: Number(backendPagination.to) || 0,
      per_page: Number(backendPagination.per_page) || 10,
    };
  }, [backendPagination]);

  const totalItems = Number(backendPagination?.total) || 0;

  const totalPages = Number(
    backendPagination?.last_page || backendPagination?.total_pages || 1
  );

  const goToPage = (page: number) => {
    if (pagination) {
      setCurrentPage(Math.max(1, Math.min(page, pagination.last_page)));
    } else {
      setCurrentPage(Math.max(1, page));
    }
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    currentPage,
    setCurrentPage: goToPage,
    goToNextPage,
    goToPreviousPage,
    pagination,
    hasNextPage: pagination ? currentPage < pagination.last_page : false,
    hasPreviousPage: currentPage > 1,
    totalItems,
    totalPages,
  };
};
