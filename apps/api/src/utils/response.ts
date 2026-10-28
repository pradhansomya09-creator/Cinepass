import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: { page: number; limit: number; total: number },
  message?: string
) {
  const totalPages = Math.ceil(meta.total / meta.limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      ...meta,
      totalPages,
    },
  });
}

export function sendError(res: Response, message: string, statusCode = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details,
  });
}
