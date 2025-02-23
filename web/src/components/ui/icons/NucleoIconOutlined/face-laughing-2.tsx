import React from 'react';
import { iconProps } from './iconProps';

function faceLaughing2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px face laughing 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.757,6.103c-.154,.154-.221,.366-.189,.583h0c.239,1.533,.238,3.112-.001,4.639-.032,.214,.035,.421,.185,.572,.153,.154,.376,.227,.598,.193,1.511-.23,2.651-1.558,2.651-3.089s-1.141-2.86-2.654-3.089c-.216-.033-.436,.039-.589,.192Z"
          fill={secondaryfill}
        />
        <path
          d="M8.25,13.25c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25,7.25c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 16.25L2.75 16.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default faceLaughing2;
