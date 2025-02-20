import React from 'react';

import { iconProps } from './iconProps';

function I12px_crosshairs2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px crosshairs 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.25,6.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1.698C11.608,2.541,9.459.392,6.75.052v1.698c0,.414-.336.75-.75.75s-.75-.336-.75-.75V.052C2.541.392.392,2.541.052,5.25h1.698c.414,0,.75.336.75.75s-.336.75-.75.75H.052c.34,2.709,2.489,4.858,5.198,5.198v-1.698c0-.414.336-.75.75-.75s.75.336.75.75v1.698c2.709-.34,4.858-2.489,5.198-5.198h-1.698Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_crosshairs2;
