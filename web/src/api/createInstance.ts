import { BusterRoutes } from '@/routes/busterRoutes/busterRoutes';
import axios, { AxiosError } from 'axios';
import { rustErrorHandler } from './buster_rest/errors';
import { AxiosRequestHeaders } from 'axios';
import { isServer } from '@tanstack/react-query';
import { getSupabaseTokenFromCookies } from './createServerInstance';

const AXIOS_TIMEOUT = 120000; // 2 minutes

export const createInstance = (baseURL: string) => {
  const apiInstance = axios.create({
    baseURL,
    timeout: AXIOS_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  apiInstance.interceptors.response.use(
    (resp) => {
      return resp;
    },
    (error: AxiosError) => {
      //Redirect to login if 401 unauthorized error
      if (error.status === 401 && !isServer) {
        // window.location.href = BusterRoutes.AUTH_LOGIN;
      }
      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultRequestHandler);
  return apiInstance;
};

export const defaultRequestHandler = async (
  config: any,
  options?: {
    accessToken: string;
  }
) => {
  let token = '';
  if (isServer) {
    token = await getSupabaseTokenFromCookies();
  } else {
    token = options?.accessToken || '';
  }

  if (token) {
    (config.headers as AxiosRequestHeaders)['Authorization'] = 'Bearer ' + token;
  }

  return config;
};
