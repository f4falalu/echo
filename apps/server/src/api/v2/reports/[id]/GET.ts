import { getReport } from '@buster/database';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

export async function getReportHandler(
  reportId: string,
  user: { id: string }
): Promise<GetReportResponse> {
  const report = await getReport({ reportId, userId: user.id });

  const response: GetReportResponse = report;

  return response;
}

const app = new Hono()
  .get('/', async (c) => {
    const reportId = c.req.param('id');
    const user = c.get('busterUser');

    if (!reportId) {
      throw new HTTPException(404, { message: 'Report ID is required' });
    }

    const response: GetReportResponse = await getReportHandler(reportId, user);
    return c.json(response);
  })
  .onError(standardErrorHandler);

export default app;
