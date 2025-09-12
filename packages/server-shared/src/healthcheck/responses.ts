import { z } from 'zod';

export const HealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string(),
  uptime: z.number(),
  version: z.string(),
  environment: z.string(),
  checks: z.record(
    z.string(),
    z.object({
      status: z.enum(['pass', 'fail', 'warn']),
      message: z.string().optional(),
      responseTime: z.number().optional(),
    })
  ),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
