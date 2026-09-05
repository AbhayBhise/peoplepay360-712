// Every rejected request throws one of these; errorHandler.ts turns it into
// the { success: false, error: "field: reason" } envelope from docs/02_API_CONTRACTS.md.
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message = "authentication required") {
    return new ApiError(401, message);
  }

  static forbidden(message = "you do not have permission to perform this action") {
    return new ApiError(403, message);
  }

  static notFound(message: string) {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
