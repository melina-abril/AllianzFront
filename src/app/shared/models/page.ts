export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export function toPage<T>(list: T[], page: number, size: number): Page<T> {
  const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
  const safeSize = Number.isFinite(size) ? Math.max(1, Math.floor(size)) : 10;
  return {
    items: list.slice(safePage * safeSize, (safePage + 1) * safeSize),
    page: safePage,
    size: safeSize,
    totalItems: list.length,
    totalPages: Math.ceil(list.length / safeSize),
  };
}
