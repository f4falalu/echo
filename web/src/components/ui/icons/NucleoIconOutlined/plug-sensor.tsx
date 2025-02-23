import React from 'react';
import { iconProps } from './iconProps';

function plugSensor(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px plug sensor';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.995,5.995c1.657-1.657,4.353-1.657,6.01,0"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 11.75L7.25 9"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 11.75L10.75 9"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.728,13.433c.951-1.227,1.522-2.761,1.522-4.433,0-4.004-3.246-7.25-7.25-7.25S1.75,4.996,1.75,9c0,1.672,.571,3.207,1.522,4.433"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,12.25v.75c0,1.795-1.455,3.25-3.25,3.25h0c-1.795,0-3.25-1.455-3.25-3.25v-.75c0-.276,.224-.5,.5-.5h5.5c.276,0,.5,.224,.5,.5Z"
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

export default plugSensor;
