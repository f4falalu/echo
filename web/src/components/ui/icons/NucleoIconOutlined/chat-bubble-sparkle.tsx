import React from 'react';
import { iconProps } from './iconProps';

function chatBubbleSparkle(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px chat bubble sparkle';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.75,8.277v-3.527c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2v11.5l3.75-3h2.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 10.25L15.25 12.25 17.25 13.25 15.25 14.25 14.25 16.25 13.25 14.25 11.25 13.25 13.25 12.25 14.25 10.25z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default chatBubbleSparkle;
