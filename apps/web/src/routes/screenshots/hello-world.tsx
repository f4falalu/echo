import { createFileRoute } from '@tanstack/react-router';
import { useMount } from '@/hooks/useMount';

export const Route = createFileRoute('/screenshots/hello-world')({
  component: RouteComponent,
});

function RouteComponent() {
  useMount(() => {
    // getMetricScreenshot({
    //   data: {
    //     metricId: '123',
    //   },
    // }).then((res) => {
    //   console.log(res);
    // });
  });

  return (
    <div className="p-10 flex flex-col h-full border-red-500 border-10 items-center justify-center bg-blue-100 text-2xl text-blue-500">
      Hello "/screenshot/hello-world"!
    </div>
  );
}
