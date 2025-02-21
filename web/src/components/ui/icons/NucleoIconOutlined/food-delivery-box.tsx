import React from 'react';
import { iconProps } from './iconProps';

function foodDeliveryBox(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px food delivery box';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M1.75 12.25H16.25V15.25H1.75z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 12.25L14.25 8.75 3.75 8.75 1.75 12.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,.75c-.022,.631-.166,1.383-.672,2-.347,.424-.636,.504-.969,.922-.325,.408-.618,1.045-.609,2.078"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,2.75c-.015,.379-.111,.83-.448,1.2-.232,.254-.424,.302-.646,.553-.217,.245-.412,.627-.406,1.247"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path d="M9,14c.966,0,1.75-.783,1.75-1.75h-3.5c0,.967,.784,1.75,1.75,1.75Z" fill={fill} />
      </g>
    </svg>
  );
}

export default foodDeliveryBox;
