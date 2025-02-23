import React from 'react';
import { iconProps } from './iconProps';

function flipVertical2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px flip vertical 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M3.75,7.25V2.543c0-.276,.224-.5,.5-.5,.075,0,.149,.017,.216,.049L14.256,6.774c.24,.115,.158,.476-.108,.476H3.75Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,10.75v4.707c0,.276,.224,.5,.5,.5,.075,0,.149-.017,.216-.049l9.79-4.682c.24-.115,.158-.476-.108-.476H3.75Z"
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

export default flipVertical2;
