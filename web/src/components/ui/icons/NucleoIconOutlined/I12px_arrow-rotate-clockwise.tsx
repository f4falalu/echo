import React from 'react';
import { iconProps } from './iconProps';

function I12px_arrowRotateClockwise(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px arrow rotate clockwise';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.718,3.694c-.854-1.743-2.646-2.944-4.718-2.944-2.899,0-5.25,2.351-5.25,5.25,0,2.899,2.351,5.25,5.25,5.25,2.34,0,4.322-1.531,5-3.646"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 3.75L10.75 3.75 10.75 0.75"
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

export default I12px_arrowRotateClockwise;
