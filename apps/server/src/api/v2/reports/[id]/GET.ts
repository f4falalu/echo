import { getReport } from '@buster/database';
import type { GetReportIndividualResponse } from '@buster/server-shared/reports';
import { markdownToPlatejs } from '@buster/server-utils/report';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

export async function getReportHandler(
  reportId: string,
  user: { id: string }
): Promise<GetReportIndividualResponse> {
  const report = await getReport({ reportId, userId: user.id });

  const platejsResult = await markdownToPlatejs(report.content);

  if (platejsResult.error) {
    console.error('Error converting markdown to PlateJS:', platejsResult.error);
    throw new HTTPException(500, {
      message: 'Error converting markdown to PlateJS',
    });
  }

  const content = platejsResult.elements ?? [];

  const response: GetReportIndividualResponse = {
    ...report,
    content,
  };

  return response;
}

const app = new Hono()
  .get('/', async (c) => {
    const reportId = c.req.param('id');
    const user = c.get('busterUser');

    if (!reportId) {
      throw new HTTPException(404, { message: 'Report ID is required' });
    }

    const response: GetReportIndividualResponse = await getReportHandler(reportId, user);
    return c.json(response);
  })
  .onError(standardErrorHandler);

export default app;
