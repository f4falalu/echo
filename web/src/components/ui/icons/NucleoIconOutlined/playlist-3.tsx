import React from 'react';
import { iconProps } from './iconProps';

function playlist3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px playlist 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.7098,8.4835l-2.2964-1.3853c-.402-.2425-.9148.047-.9148.5165v2.7706c0,.4695.5128.759.9148.5165l2.2964-1.3853c.3888-.2346.3888-.7984,0-1.033Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="M16.25 4.25L16.25 13.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 4.25L1.75 13.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="2.75"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default playlist3;
