import React from 'react';

export default function TestPage() {
  return (
    <div className="flex flex-col gap-4 bg-red-500">
      <div className="flex space-x-3">
        <h1>Test</h1>
        <h2>TESTING!</h2>
      </div>
      <div className="bg-blue-500">
        <h2>Test</h2>
      </div>

      <div className="flex flex-col gap-4 bg-green-200 dark:bg-green-900">
        <h1>Test</h1>
        <h2>TESTING!!!! :)</h2>
      </div>

      <div className="rounded-lg bg-white px-6 py-8 ring shadow-xl ring-gray-900/5 dark:bg-gray-800">
        <h3 className="mt-5 text-base font-medium tracking-tight text-gray-900 dark:text-white">
          Writes upside-down
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The Zero Gravity Pen can be used to write in any orientation, including upside-down. It
          even works in outer space.
        </p>
      </div>

      {/* <div class="bg-white dark:bg-gray-800 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5">
  <div>
    <span class="inline-flex items-center justify-center rounded-md bg-indigo-500 p-2 shadow-lg">
      <svg class="h-6 w-6 stroke-white" ...>
        <!-- ... -->
      </svg>
    </span>
  </div>
  <h3 class="text-gray-900 dark:text-white mt-5 text-base font-medium tracking-tight ">Writes upside-down</h3>
  <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm ">
    The Zero Gravity Pen can be used to write in any orientation, including upside-down. It even works in outer space.
  </p>
</div> */}
    </div>
  );
}
