import React from 'react';
import { iconProps } from './iconProps';

function keyboardMouse(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px keyboard mouse';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.75,11.75H2.75c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2H15.25c1.105,0,2,.895,2,2v2.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.75L6.25 8.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 12.25L13.75 11.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="3" y="5.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="3" y="8" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="5.5" y="5.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="8.25" y="5.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="13.5" y="5.5" />
        <rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="11" y="5.5" />
        <rect
          height="7.5"
          width="5"
          fill="none"
          rx="2"
          ry="2"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="8.75"
        />
      </g>
    </svg>
  );
}

export default keyboardMouse;
