import React from 'react';

import { iconProps } from './iconProps';

function bucket(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'bucket';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1.5c-3.479,0-7,1.03-7,3,0,.094,.039,.351,.041,.361l1.209,9.089c0,1.752,2.98,2.55,5.75,2.55s5.75-.798,5.75-2.55l1.209-9.089c.002-.01,.041-.267,.041-.361,0-1.97-3.521-3-7-3Zm5.491,3.02c-.049,.446-1.964,1.48-5.491,1.48s-5.442-1.035-5.491-1.48l-.004-.031c.028-.441,1.948-1.489,5.495-1.489s5.467,1.048,5.495,1.489l-.004,.031Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default bucket;
