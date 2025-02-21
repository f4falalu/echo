import React from 'react';
import { iconProps } from './iconProps';

function grid3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px grid 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="2.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.75"
          y="2.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="7.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="7.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.75"
          y="7.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="12.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="12.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.75"
          y="12.75"
        />
      </g>
    </svg>
  );
}

export default grid3;
