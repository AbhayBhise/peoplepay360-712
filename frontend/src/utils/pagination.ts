import { PaginatedResult, PaginationFilters } from '../types';

/**
 * Normalizes an API response to always be a PaginatedResult, 
 * converting array responses to a paginated format.
 */
export function normalizePaginatedResult<T>(
  result: PaginatedResult<T> | T[],
  defaultLimit = 10
): PaginatedResult<T> {
  if (Array.isArray(result)) {
    return {
      items: result,
      total: result.length,
      page: 1,
      limit: defaultLimit,
      totalPages: 1
    };
  }
  return result;
}

/**
 * Extracts just the items from a paginated or array response.
 * Useful for components that haven't been updated to use server-side pagination yet.
 */
export function extractItems<T = any>(result: any): T[] {
  if (!result) return [];
  if (Array.isArray(result)) {
    return result;
  }
  if (Array.isArray(result?.items)) {
    return result.items;
  }
  if (Array.isArray(result?.data)) {
    return result.data;
  }
  return [];
}
