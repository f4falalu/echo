import React from 'react';
import { iconProps } from './iconProps';

function labelMinus(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px label minus';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.982,15.251c-.346,.597-.992,.999-1.732,.999H5.75c-1.105,0-2-.895-2-2V7.388c0-.565,.239-1.104,.658-1.483l3.921-3.547c.381-.345,.961-.345,1.342,0l3.921,3.547c.419,.379,.658,.918,.658,1.483v2.862"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75 12.75L11.75 12.75"
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

export default labelMinus;
