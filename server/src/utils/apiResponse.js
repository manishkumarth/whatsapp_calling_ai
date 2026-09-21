class ApiResponse {
  static success(res, { message = 'Success', data = null, statusCode = 200 } = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, { message = 'Internal Server Error', error = null, statusCode = 500 } = {}) {
    const response = {
      success: false,
      message,
    };
    if (error && process.env.NODE_ENV !== 'production') {
      response.error = error;
    }
    return res.status(statusCode).json(response);
  }

  static paginated(res, { data, total, page, limit, message = 'Success' }) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  }
}

module.exports = ApiResponse;
