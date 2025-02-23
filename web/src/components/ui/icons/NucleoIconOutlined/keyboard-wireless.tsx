import React from 'react';
import { iconProps } from './iconProps';

function keyboardWireless(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px keyboard wireless';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="8.5"
          width="16.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="6.75"
        />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="3" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="3" y="11.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="5.5" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="8.25" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="13.5" y="9" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="13.5" y="11.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="11" y="9" />
        <path
          d="M11.75 12.25L6.25 12.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.939,4.189c.586-.586,1.536-.586,2.121,0"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.818,2.068c1.757-1.757,4.607-1.757,6.364,0"
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

export default keyboardWireless;
