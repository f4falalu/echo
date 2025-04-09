export default async function DashboardVersionPage({
  params
}: {
  params: Promise<{ versionNumber: string }>;
}) {
  const { versionNumber } = await params;
  return <div>DashboardVersionPage {versionNumber}</div>;
}
