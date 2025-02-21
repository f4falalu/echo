import React from 'react';
import { iconProps } from './iconProps';

function mediaSkipToEnd(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px media skip to end';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M1.5,4.946c1.446,.872,4.6,2.776,6.011,3.628,.322,.194,.318,.661-.004,.856L1.504,13.052c-.332,.2-.754-.04-.754-.429V5.377c0-.389,.418-.632,.75-.432Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5,4.946c1.446,.872,4.6,2.776,6.011,3.628,.322,.194,.318,.661-.004,.856l-6.002,3.623c-.332,.2-.754-.04-.754-.429V5.377c0-.389,.418-.632,.75-.432Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 13.75L17.25 4.25"
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

export default mediaSkipToEnd;
