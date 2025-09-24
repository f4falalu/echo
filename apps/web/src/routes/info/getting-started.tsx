import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/info/getting-started')({
  component: GettingStartedPage,
});

export default function GettingStartedPage() {
  useEffect(() => {
    window.location.replace('https://buster.so/sign-up');
  }, []);
  return null;
}