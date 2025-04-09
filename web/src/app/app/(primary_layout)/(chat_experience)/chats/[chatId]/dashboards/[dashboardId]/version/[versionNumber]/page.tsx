export default async function Page({ params }: { params: Promise<{ versionNumber: string }> }) {
  const { versionNumber } = await params;
  return <div>Version {versionNumber}</div>;
}
