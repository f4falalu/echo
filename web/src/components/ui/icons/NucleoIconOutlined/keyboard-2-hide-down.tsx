import React from 'react';
import { iconProps } from './iconProps';

function keyboard2HideDown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px keyboard 2 hide down';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="10.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="1.75"
        />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="6.875" y="6" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="4.125" y="6" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="9.625" y="6" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="12.375" y="6" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="5.5" y="4" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="8.25" y="4" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="11" y="4" />
        <path
          d="M11.25 9.25L6.75 9.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 14.75L9 17.25 6.5 14.75"
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

export default keyboard2HideDown;
