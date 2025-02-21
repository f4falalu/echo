import React from 'react';
import { iconProps } from './iconProps';

function I12px_house2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px house 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M6 10.75L6 8"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.685,3.5L5.435.934c.34-.233.789-.233,1.129,0l3.75,2.566c.272.186.435.495.435.825v4.425c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2v-4.425c0-.33.163-.639.435-.825Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default I12px_house2;
