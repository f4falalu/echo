import React from 'react';
import { iconProps } from './iconProps';

function chatBubbleForward(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px chat bubble forward';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.5,8.25H3.25c-.552,0-1,.448-1,1v7l3.75-3h7.75c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2H4.25c-1.105,0-2,.895-2,2v.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 5.75L10.75 8.25 8.25 10.75"
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

export default chatBubbleForward;
