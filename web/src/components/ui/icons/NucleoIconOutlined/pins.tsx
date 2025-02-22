import React from 'react';
import { iconProps } from './iconProps';

function pins(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px pins';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.25,7.425c0,2.382-3.114,6.208-4.545,7.84-.375,.427-1.034,.427-1.409,0-1.431-1.633-4.545-5.458-4.545-7.84,0-3.171,2.713-5.011,5.25-5.011s5.25,1.84,5.25,5.011Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.228,2.886c1.679,.736,3.022,2.308,3.022,4.539,0,2.382-3.114,6.208-4.545,7.84-.187,.214-.446,.321-.705,.321"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7"
          cy="7.75"
          fill="none"
          r="1.75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pins;
