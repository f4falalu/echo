import { createServerFn, type ServerFnResponseType } from '@tanstack/react-start';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { BASE_URL } from './config';
import { createAxiosInstance } from './createAxiosInstance';

export const getSupabaseAccessTokenServerFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = getSupabaseServerClient();
    const sessionData = await supabase.auth.getSession();
    const accessToken = sessionData.data?.session?.access_token;
    return accessToken;
  }
);

// export const serverFetch = createServerFn({ method: 'GET' })
//   .validator(
//     z.object({
//       url: z.string(),
//       config: z
//         .object({
//           baseURL: z.string().optional(),
//           params: z.record(z.string(), z.unknown()).optional(),
//           method: z.string().optional(),
//           headers: z.record(z.string(), z.unknown()).optional(),
//         })
//         .optional(),
//     })
//   )
//   .handler(async ({ data: { url, config } }) => {
//     const accessToken = await getSupabaseAccessTokenServerFn();

//     const {
//       baseURL = BASE_URL,
//       params,
//       headers = {},
//       method = 'GET',
//       ...restConfig
//     } = config || {};

//     const queryParams = params
//       ? `?${new URLSearchParams(
//           Object.fromEntries(
//             Object.entries(params)
//               .filter(([_, v]) => v !== undefined)
//               .map(([k, v]) => [k, String(v)])
//           )
//         )}`
//       : '';

//     const finalHeaders = {
//       ...headers,
//       'Content-Type': 'application/json',
//       Accept: 'application/json',
//       ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
//     };

//     const fullUrl = `${baseURL}${url}${queryParams}`;

//     try {
//       const response = await fetch(fullUrl, {
//         method,
//         ...restConfig,
//         headers: finalHeaders,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();

//         throw {
//           status: response.status,
//           message: errorText || response.statusText,
//         } satisfies RustApiError;
//       }

//       return response.json();
//     } catch (error) {
//       console.error('Fetch error:', error);
//       throw error;
//     }
//   });

export const serverFetch = <TResponse extends ServerFnResponseType = 'data'>() =>
  createServerFn<'GET', 'data', TResponse>({ method: 'GET' })
    .validator(
      z.object({
        url: z.string(),
        config: z
          .object({
            baseURL: z.string().optional(),
            params: z.record(z.string(), z.unknown()).optional(),
            method: z.string().optional(),
          })
          .optional(),
      })
    )
    .handler(async ({ data: { url, config } }) => {
      const axios = createAxiosInstance(config?.baseURL || BASE_URL);
      const response = await axios.request({
        url,
        method: config?.method || 'GET',
        params: config?.params,
      });

      return response.data;
    });
