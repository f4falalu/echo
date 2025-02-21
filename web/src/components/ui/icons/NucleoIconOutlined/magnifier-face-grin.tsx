import React from 'react';
import { iconProps } from './iconProps';

function magnifierFaceGrin(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px magnifier face grin';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="7.75"
          cy="7.75"
          fill="none"
          r="5"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.5" cy="7.25" fill={secondaryfill} r=".75" />
        <circle cx="10" cy="7.25" fill={secondaryfill} r=".75" />
        <path
          d="M15.25 15.25L11.285 11.285"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75,8.5h2c.276,0,.5,.224,.5,.5h0c0,.828-.672,1.5-1.5,1.5h0c-.828,0-1.5-.672-1.5-1.5h0c0-.276,.224-.5,.5-.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default magnifierFaceGrin;
