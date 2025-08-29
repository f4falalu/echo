import type { ElectricShapeOptions } from '../instances';
import type { GetReportResponse } from '@buster/server-shared/reports';

export type BusterReportShape = Pick<GetReportResponse, 'id' | 'name' | 'content'>;

const REPORT_DEFAULT_COLUMNS: (keyof BusterReportShape)[] = ['id', 'name', 'content'];

export const reportShape = ({
  reportId
}: {
  reportId: string;
}): ElectricShapeOptions<BusterReportShape> => {
  return {
    params: {
      table: 'report_files',
      where: `id='${reportId}'`,
      columns: REPORT_DEFAULT_COLUMNS,
      replica: 'default'
    }
  };
};
