import React from 'react';
import { iconProps } from './iconProps';

function sneeze(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px sneeze';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="6.25" cy="7.25" fill={fill} r=".75" />
        <circle cx="12.75" cy="11.75" fill={secondaryfill} r=".75" />
        <circle cx="15.25" cy="9.75" fill={secondaryfill} r=".75" />
        <circle cx="15.25" cy="13.75" fill={secondaryfill} r=".75" />
        <path
          d="M5.25,16.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.5-2c0-3.397-2.823-6.134-6.25-5.995"
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

export default sneeze;
