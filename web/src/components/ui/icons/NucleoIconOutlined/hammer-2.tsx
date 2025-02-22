import React from 'react';
import { iconProps } from './iconProps';

function hammer2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px hammer 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.529,8.721l-6.563,6.563c-.621,.621-1.629,.621-2.25,0h0c-.621-.621-.621-1.629,0-2.25l6.563-6.563"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.207,8.944l-1.521,1.521c-.391,.391-1.024,.391-1.414,0L5.742,2.934l.934-.934,4.191,.493c.223,.026,.431,.127,.59,.286l4.75,4.75c.391,.391,.391,1.024,0,1.414Z"
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

export default hammer2;
