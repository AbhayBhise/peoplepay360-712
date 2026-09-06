import { z } from "zod";
import { Request } from "express";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

// Every list endpoint uses this so paging is consistent everywhere: cap at 100/page so
// nobody can accidentally (or deliberately) request the entire table in one response.
export function parsePagination(req: Request): PaginationParams {
  const { page, limit } = paginationQuerySchema.parse({
    page: req.query.page,
    limit: req.query.limit,
  });
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

// Pagination is opt-in on every list endpoint: only kicks in if the caller sends `page`
// or `limit`, so existing call sites that expect a bare array keep working unchanged.
export function parsePaginationIfRequested(req: Request): PaginationParams | undefined {
  if (req.query.page === undefined && req.query.limit === undefined) return undefined;
  return parsePagination(req);
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginatedResult<T>(items: T[], total: number, params: PaginationParams): PaginatedResult<T> {
  return {
    items,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}
