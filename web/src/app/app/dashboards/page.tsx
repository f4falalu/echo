import { AppContentHeader } from '../../../components/layout/AppContentHeader';
import { DashboardHeader } from './_DashboardHeader';
import { DashboardListContent } from './_DashboardListContent';

export default function DashboardPage(props: any) {
  return (
    <>
      <DashboardHeader />
      <DashboardListContent />
    </>
  );
}
