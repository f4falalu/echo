import React from 'react';

import { iconProps } from './iconProps';

function I12px_arrowsOppositeDirectionY(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px arrows opposite direction y';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.22,8.22l-1.22,1.22v-4.189c0-.414-.336-.75-.75-.75s-.75.336-.75.75v4.189l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m4.28.22c-.293-.293-.768-.293-1.061,0L.72,2.72c-.293.293-.293.768,0,1.061s.768.293,1.061,0l1.22-1.22v4.189c0,.414.336.75.75.75s.75-.336.75-.75V2.561l1.22,1.22c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061L4.28.22Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_arrowsOppositeDirectionY;
