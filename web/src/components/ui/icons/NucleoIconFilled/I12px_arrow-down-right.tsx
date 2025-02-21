import React from 'react';

import { iconProps } from './iconProps';

function I12px_arrowDownRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px arrow down right';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.073,10.823c-.192,0-.384-.073-.53-.22L1.22,2.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l8.323,8.323c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m10.25,11h-4.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4v-4c0-.414.336-.75.75-.75s.75.336.75.75v4.75c0,.414-.336.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_arrowDownRight;
