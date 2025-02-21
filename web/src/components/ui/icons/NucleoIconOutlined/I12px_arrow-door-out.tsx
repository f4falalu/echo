import React from 'react';
import { iconProps } from './iconProps';

function I12px_arrowDoorOut(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px arrow door out';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.25 6L1 6"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3 8.25L0.75 6 3 3.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.77,1.15l-2.16,1.8c-.228.19-.36.471-.36.768v4.563c0,.297.132.578.36.768l2.16,1.8"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m4.776,10.008c.123.705.734,1.242,1.474,1.242h3.5c.828,0,1.5-.672,1.5-1.5V2.25c0-.828-.672-1.5-1.5-1.5h-3.5c-.74,0-1.351.537-1.474,1.242"
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

export default I12px_arrowDoorOut;
