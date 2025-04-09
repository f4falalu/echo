export default async function MetricVersionPage({
  params
}: {
  params: Promise<{ versionNumber: string }>;
}) {
  const { versionNumber } = await params;
  return <div>MetricVersionPage {versionNumber}</div>;
}
