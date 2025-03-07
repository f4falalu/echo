import React, { useRef } from 'react';

export const Test = () => {
  const ref = useRef<HTMLDivElement>(null);
  return <div ref={ref}>Test</div>;
};
