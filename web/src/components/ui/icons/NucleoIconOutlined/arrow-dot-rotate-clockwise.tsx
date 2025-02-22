import React from 'react';
import { iconProps } from './iconProps';

function arrowDotRotateClockwise(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px arrow dot rotate clockwise';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="14.25"
          cy="13.75"
          fill="none"
          r="2"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10,16.182c-.327,.045-.661,.068-1,.068-4.004,0-7.25-3.246-7.25-7.25,0-4.004,3.246-7.25,7.25-7.25,3.031,0,5.627,1.86,6.71,4.5"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.12 3.305L15.712 6.25 12.768 5.843"
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

export default arrowDotRotateClockwise;
