import React from 'react';
import { iconProps } from './iconProps';

function label2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px label 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.408,5.905l3.921-3.547c.381-.345,.961-.345,1.342,0l3.921,3.547c.419,.379,.658,.918,.658,1.483v6.862c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2V7.388c0-.565,.239-1.104,.658-1.483Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 13.25L11.25 13.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="6.75" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default label2;
