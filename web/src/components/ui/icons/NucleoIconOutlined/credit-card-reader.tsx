import React from 'react';
import { iconProps } from './iconProps';

function creditCardReader(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px credit card reader';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.75,12.25H3.75c-1.105,0-2-.895-2-2V3.75c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v6.5c0,1.105-.895,2-2,2h-2"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 5.75L16.25 5.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 15.75L9 17.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="6.5"
          width="6.5"
          fill="none"
          rx="1.182"
          ry="1.182"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="5.75"
          y="9.25"
        />
        <rect height="3" width="3" fill={secondaryfill} rx=".25" ry=".25" x="7.5" y="11" />
      </g>
    </svg>
  );
}

export default creditCardReader;
