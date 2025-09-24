import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useMount } from '../hooks/useMount';

export const Route = createFileRoute('/app/throw')({
  component: RouteComponent,
});

function RouteComponent() {
  const [throwError, setThrowError] = useState(false);

  useMount(() => {
    setTimeout(() => {
      setThrowError(true);
    }, 1000);
  });

  if (throwError) {
    throw new Error('Nate is testing this error');
  }

  return <div>Hello "/app/throw"! {throwError ? 'Throwing error' : 'Not throwing error'}</div>;
}
