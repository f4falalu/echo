import React from 'react';
import { IndeterminateLinearLoader } from '@/components/ui/loaders/IndeterminateLinearLoader';

export default function TestPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col space-y-5">
        <div>Test</div>
        <div>TESTING!</div>
        <div>TESTING123</div>
      </div>

      <div className="bg-primary-light dark:bg-primary-dark flex flex-col gap-4">
        <h1>Test</h1>
        <h2>TESTING!!!! :)</h2>

        <p className="border-primary-dark border font-mono">Hello</p>
        <a>This is a not link</a>
        <a href="https://www.google.com">This is a link</a>
      </div>
      <div className="!mt-5 flex flex-col gap-4">
        <IndeterminateLinearLoader />
        <IndeterminateLinearLoader />
        <IndeterminateLinearLoader />
        <IndeterminateLinearLoader />
      </div>
    </div>
  );
}
