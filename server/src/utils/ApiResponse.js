/**
 * Every API response, success or failure, uses this envelope shape so the
 * frontend's axios interceptor can handle all responses uniformly:
 * { success, message, data, meta?, error? }
 */
class ApiResponse {
  static success(res, { message = 'Success', data = null, meta = undefined, statusCode = 200 } = {}) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created(res, { message = 'Created', data = null } = {}) {
    return ApiResponse.success(res, { message, data, statusCode: 201 });
  }

  static paginated(res, { message = 'Success', items, page, limit, total }) {
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return ApiResponse.success(res, {
      message,
      data: items,
      meta: { page, limit, total, totalPages },
    });
  }
}

module.exports = ApiResponse;
