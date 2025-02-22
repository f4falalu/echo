import React from 'react';
import { iconProps } from './iconProps';

function eyeLens(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px eye lens';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="2.75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.927,11.413c.405-.454,.733-.899,.985-1.281,.45-.683,.45-1.582,0-2.265-1.017-1.544-3.262-4.118-6.912-4.118S3.106,6.324,2.088,7.867c-.45,.683-.45,1.582,0,2.265,1.017,1.544,3.262,4.118,6.912,4.118,.539,0,1.044-.062,1.522-.162"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.922 10.966L14.25 14.25"
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

export default eyeLens;
