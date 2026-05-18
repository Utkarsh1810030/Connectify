export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export const buildPagination = (
  page: number = 1,
  limit: number = 20,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  hasNext: page * limit < total,
});

export const getPaginationOffset = (page: number, limit: number): number =>
  (Math.max(1, page) - 1) * limit;
