import type { ElectricShapeOptions } from '../instances';
import type { ReportIndividualResponse } from '@buster/server-shared/reports';

export type BusterReportShape = Pick<ReportIndividualResponse, 'id' | 'name' | 'content'>;

const REPORT_DEFAULT_COLUMNS: (keyof BusterReportShape)[] = ['id', 'name', 'content'];

export const reportShape = ({
  reportId
}: {
  reportId: string;
}): ElectricShapeOptions<BusterReportShape> => {
  return {
    params: {
      table: 'reports',
      where: `id='${reportId}'`,
      columns: REPORT_DEFAULT_COLUMNS,
      replica: 'default'
    }
  };
};
