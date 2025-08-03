import type { User } from '@buster/database';
import type {
  GetReportsListRequest,
  GetReportsListResponse,
  ReportResponse,
} from '@buster/server-shared/reports';
import { GetReportsListRequestSchema } from '@buster/server-shared/reports';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

async function getReportsListHandler(
  request: GetReportsListRequest,
  user: User
): Promise<GetReportsListResponse> {
  const stubbedReports: ReportResponse[] = [
    {
      id: 'report-1',
      name: 'Sales Analysis Q4',
      file_name: 'sales_analysis_q4.md',
      description: 'Quarterly sales performance analysis',
      created_by: user.id,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      deleted_at: null,
      publicly_accessible: false,
      content: [
        {
          type: 'h1' as const,
          children: [{ text: 'Sales Analysis Q4' }],
        },
        {
          type: 'p' as const,
          children: [{ text: 'This report analyzes our Q4 sales performance.' }],
        },
      ],
    },
    {
      id: 'report-2',
      name: 'Customer Metrics Dashboard',
      file_name: 'customer_metrics.md',
      description: 'Key customer engagement metrics',
      created_by: user.id,
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      deleted_at: null,
      publicly_accessible: true,
      content: [
        {
          type: 'h1' as const,
          children: [{ text: 'Customer Metrics' }],
        },
      ],
    },
    {
      id: 'report-3',
      name: 'Marketing Campaign Results',
      file_name: 'marketing_campaign_results.md',
      description: 'Analysis of recent marketing campaigns',
      created_by: user.id,
      created_at: '2024-01-05T08:30:00Z',
      updated_at: '2024-01-12T11:15:00Z',
      deleted_at: null,
      publicly_accessible: false,
      content: [
        {
          type: 'h1' as const,
          children: [{ text: 'Marketing Campaign Results' }],
        },
        {
          type: 'p' as const,
          children: [
            { text: 'Overview of our recent marketing initiatives and their performance.' },
          ],
        },
      ],
    },
  ];

  const { page, page_size } = request;
  const startIndex = page * page_size;
  const endIndex = startIndex + page_size;
  const paginatedReports = stubbedReports.slice(startIndex, endIndex);

  const result: GetReportsListResponse = {
    data: paginatedReports,
    pagination: {
      page,
      page_size,
      total: stubbedReports.length,
      total_pages: Math.ceil(stubbedReports.length / page_size),
    },
  };

  return result;
}

const app = new Hono().get('/', zValidator('query', GetReportsListRequestSchema), async (c) => {
  const request = c.req.valid('query');
  const user = c.get('busterUser');

  const response = await getReportsListHandler(request, user);
  return c.json(response);
});

export default app;
