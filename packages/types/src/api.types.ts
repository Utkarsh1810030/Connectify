export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface OtpRequestDto {
  phone: string;
}

export interface OtpVerifyDto {
  phone: string;
  otp: string;
}
