import React from 'react';

import { iconProps } from './iconProps';

function I12px_arrowsExpandX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px arrows expand x';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9.03,2.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.47,1.47h-2.189c-.414,0-.75.336-.75.75s.336.75.75.75h2.189l-1.47,1.47c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.75-2.75c.293-.293.293-.768,0-1.061l-2.75-2.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m4.75,5.25h-2.189l1.47-1.47c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0L.22,5.47c-.293.293-.293.768,0,1.061l2.75,2.75c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.47-1.47h2.189c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_arrowsExpandX;
