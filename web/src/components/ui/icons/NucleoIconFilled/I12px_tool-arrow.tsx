import React from 'react';

import { iconProps } from './iconProps';

function I12px_toolArrow(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px tool arrow';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m1.25,11.5c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l6.167-6.167c.293-.293.768-.293,1.061,0s.293.768,0,1.061L1.78,11.28c-.146.146-.338.22-.53.22Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m11.28.72c-.2-.201-.497-.271-.768-.181l-5,1.667c-.246.082-.433.286-.492.539-.061.253.016.519.199.703l3.333,3.333c.143.143.334.22.53.22.058,0,.115-.006.172-.02.253-.06.457-.246.54-.493l1.667-5c.09-.27.02-.567-.182-.768Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_toolArrow;
