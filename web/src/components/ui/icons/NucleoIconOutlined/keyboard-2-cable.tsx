import React from 'react';
import { iconProps } from './iconProps';

function keyboard2Cable(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px keyboard 2 cable';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,4.75v-.75c0-.966,.784-1.75,1.75-1.75h1.75c.793,0,1.462-.527,1.677-1.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 12.25L6.75 12.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
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
          y="4.75"
        />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="6.875" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="4.125" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="9.625" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="12.375" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="5.5" y="7" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="8.25" y="7" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="11" y="7" />
      </g>
    </svg>
  );
}

export default keyboard2Cable;
