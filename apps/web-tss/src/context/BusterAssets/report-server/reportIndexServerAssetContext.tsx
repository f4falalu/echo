import { ReportPageController } from '@/controllers/ReportPageControllers/ReportPageController';
import { useGetReportParams } from '../../Reports/useGetReportParams';

export const component = () => {
  const params = useGetReportParams();
  return <ReportPageController {...params} />;
};
