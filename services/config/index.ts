import { ApiConfig, ApiResponse, ApiError } from "../types";
import { CookieManager } from "./cookie-manager";

// Configuration module for API settings and utilities

// Debug mode - set to true only when you need detailed logging
export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "false";

// Configuration for different environments
const configs: Record<string, ApiConfig> = {
  development: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    timeout: 30000, // 30 seconds - reduced from 5 minutes
    retries: 3,
    headers: {
      "Content-Type": "application/json",
    },
  },
  production: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL || "https://youdidnttest.noki.co.za",
    timeout: 30000, // 30 seconds - reduced from 5 minutes
    retries: 2,
    headers: {
      "Content-Type": "application/json",
    },
  },
  test: {
    baseUrl: "http://localhost:3000",
    timeout: 30000, // 30 seconds - reduced from 5 minutes
    retries: 1,
    headers: {
      "Content-Type": "application/json",
    },
  },
};

// Get current environment
const getCurrentEnvironment = (): string => {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV || "development";
  }
  return process.env.NODE_ENV || "development";
};

// Get configuration for current environment
export const getApiConfig = (): ApiConfig => {
  const env = getCurrentEnvironment();
  return configs[env] || configs.development;
};

// Token management utilities (deprecated - use CookieManager instead)
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = "noki_access_token";
  private static readonly REFRESH_TOKEN_KEY = "noki_refresh_token";

  static getAccessToken(): string | null {
    return CookieManager.getAccessToken();
  }

  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    CookieManager.setAccessToken(accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  static clearTokens(): void {
    CookieManager.clearAccessToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  static isTokenExpired(token: string): boolean {
    return CookieManager.isTokenExpired(token);
  }
}

// API Error class for better error handling
export class ApiException extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiException";
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

// Request interceptor for adding auth headers
export const createAuthHeaders = (): Record<string, string> => {
  const token = CookieManager.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Response interceptor for handling common responses
export const handleApiResponse = async (
  response: Response
): Promise<ApiResponse<any>> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle standardized error response format from backend
    // Backend now returns: { success: false, error: { code, message, details }, timestamp }
    if (errorData.error && errorData.error.code) {
      throw new ApiException({
        message: errorData.error.message || response.statusText,
        code: errorData.error.code || "UNKNOWN_ERROR",
        status: response.status,
        details: errorData.error.details || errorData,
      });
    }
    
    // Fallback for old error format
    throw new ApiException({
      message: errorData.message || response.statusText,
      code: errorData.code || "UNKNOWN_ERROR",
      status: response.status,
      details: errorData,
    });
  }

  const data = await response.json();
  
  // Handle standardized success response format from backend
  // Backend now returns: { success: true, data: ..., message?: ..., timestamp: ... }
  if (data && typeof data === 'object' && 'success' in data) {
    return {
      data: data.data || data,
      message: data.message,
      success: data.success !== false,
      status: response.status,
    };
  }
  
  // Fallback for old response format (raw data)
  return {
    data: data.data || data,
    message: data.message,
    success: data.success !== false,
    status: response.status,
  };
};

// Retry utility for failed requests
export const withRetry = async (
  fn: () => Promise<any>,
  retries: number = 3,
  delay: number = 1000
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Export CookieManager
export { CookieManager } from "./cookie-manager";
