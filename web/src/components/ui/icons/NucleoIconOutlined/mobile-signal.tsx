import React from 'react';
import { iconProps } from './iconProps';

function mobileSignal(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px mobile signal';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.018,10.768c.452-.452,.732-1.077,.732-1.768,0-.69-.28-1.315-.732-1.768"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.786,12.536c.905-.905,1.464-2.155,1.464-3.536,0-1.381-.56-2.631-1.464-3.536"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 13.75L10 13.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25,4.877v-1.127c0-1.104-.895-2-2-2H4.75c-1.105,0-2,.896-2,2V14.25c0,1.104,.895,2,2,2h6.5c1.105,0,2-.896,2-2v-1.127"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.25" cy="9" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default mobileSignal;
