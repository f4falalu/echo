import React from 'react';
import { iconProps } from './iconProps';

function cloudSnow(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px cloud snow';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.75 11.75L8.75 16.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.585 13L10.915 15.5"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.585 15.5L10.915 13"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.163,14.192c1.755-.313,3.087-1.847,3.087-3.692,0-1.736-1.185-3.182-2.786-3.609-.186-2.314-2.102-4.141-4.464-4.141-2.485,0-4.5,2.015-4.5,4.5,0,.35,.049,.686,.124,1.013-1.597,.067-2.874,1.374-2.874,2.987,0,1.441,1.016,2.645,2.371,2.934"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.705,8c.687-.767,1.684-1.25,2.795-1.25,.333,0,.657,.059,.964,.141"
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

export default cloudSnow;
