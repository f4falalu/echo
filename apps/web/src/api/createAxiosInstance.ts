import { isServer } from '@tanstack/react-query';
import type { AxiosRequestHeaders } from 'axios';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Route as AuthRoute } from '@/routes/auth.login';
import { checkTokenValidity } from './auth_helpers/check-token-validity';
import { BASE_URL_V2 } from './config';
import { rustErrorHandler } from './errors';
import { getSupabaseSessionServerFn } from './server-functions/getSupabaseSession';

const AXIOS_TIMEOUT = 120000; // 2 minutes

export const createAxiosInstance = (baseURL = BASE_URL_V2) => {
  const apiInstance = axios.create({
    baseURL,
    timeout: AXIOS_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Response interceptor with retry logic for auth errors
  apiInstance.interceptors.response.use(
    (resp) => {
      return resp;
    },
    async (error: AxiosError) => {
      const errorCode = error.response?.status;

      //402 is the payment required error code
      if (errorCode === 402) {
        window.location.href = AuthRoute.to;
        return Promise.reject(rustErrorHandler(error));
      }

      // Handle 401 Unauthorized - token might be expired
      if (errorCode === 401 && !isServer) {
        // Only retry once to avoid infinite loops
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Force token refresh and retry the request
            console.info('401 error detected, attempting to refresh token and retry request');

            // The request interceptor will handle getting the new token
            return apiInstance(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token and retry request:', refreshError);
            // If refresh fails, redirect to login or show error
            window.location.href = AuthRoute.to;
          }
        }
      }

      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultAxiosRequestHandler);
  return apiInstance;
};

export const defaultAxiosRequestHandler = async (config: InternalAxiosRequestConfig<unknown>) => {
  let token: string | undefined = '';

  try {
    if (isServer) {
      try {
        const sessionResponse = await getSupabaseSessionServerFn();
        token = sessionResponse?.data?.accessToken;
      } catch (supabaseError) {
        // Handle headers already sent error gracefully
        if (
          supabaseError instanceof Error &&
          supabaseError.message.includes('ERR_HTTP_HEADERS_SENT')
        ) {
          console.warn('Headers already sent when getting auth token, proceeding without token');
          // Continue without token rather than crashing
          return config;
        }
        // For other errors, log but continue without token instead of throwing
        console.warn('Failed to get auth token from Supabase:', supabaseError);
        return config;
      }
    } else {
      // Always check token validity before making requests
      const tokenResult = await checkTokenValidity();
      token = tokenResult?.access_token || '';
    }

    if (!token) {
      // Log warning but don't throw - let the request proceed and handle auth errors in response interceptor
      console.warn('No auth token available for request');
      return config;
    }

    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;

    return config;
  } catch (error) {
    // Log the error but don't throw to prevent unhandled rejections
    console.error('Error in axios request handler:', error);
    // Return config without auth header - let the backend handle unauthorized requests
    return config;
  }
};
