import React from 'react';
import { iconProps } from './iconProps';

function sharkWater(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px shark water';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m13.2153,10.624c-.3463-4.2192-4.0056-7.8337-8.2773-7.8459,0,0,1.2502,4.333.0654,7.821"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,15.25c1.401.007,2.731-.613,3.625-1.692,1.678,2.002,4.661,2.265,6.663.587.212-.178.409-.374.587-.587.894,1.078,2.224,1.699,3.625,1.692"
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

export default sharkWater;
