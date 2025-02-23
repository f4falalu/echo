import React from 'react';

import { iconProps } from './iconProps';

function I12px_export(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px export';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m8.75,5h-2v3.75c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-3.75h-2c-1.517,0-2.75,1.233-2.75,2.75v1.5c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75v-1.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m4.28,3.53l.97-.97v2.439h1.5v-2.439l.97.97c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061L6.53.22c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293.293-.293.768,0,1.061s.768.293,1.061,0Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_export;
