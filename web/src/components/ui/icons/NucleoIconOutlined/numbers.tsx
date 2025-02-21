import React from 'react';
import { iconProps } from './iconProps';

function numbers(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px numbers';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.969,6.931c.4-1.423,1.78-2.202,3.27-2.181,1.491,.022,2.893,.689,2.981,2.181s-1.491,2.491-3.127,3.159c-1.635,.668-2.992,1.291-3.127,3.16h6.258"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,13.25V4.75s-.974,1.712-3.04,2.108"
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

export default numbers;
