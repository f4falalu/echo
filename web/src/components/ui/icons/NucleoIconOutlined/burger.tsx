import React from 'react';
import { iconProps } from './iconProps';

function burger(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px burger';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,10.25c-1.065,0-1.352,1-2.417,1s-1.352-1-2.417-1-1.352,1-2.417,1-1.352-1-2.417-1-1.352,1-2.417,1-1.352-1-2.417-1"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.75h5.898c.324,0,.564-.299,.488-.615-.321-1.336-1.481-4.385-5.386-4.385h-1c-.304,0-.637,0-1,0-3.905,0-5.065,3.05-5.386,4.385-.076,.316,.163,.615,.488,.615h5.898Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.25s-.25,2-3.25,2c-.859,0-4.641,0-5.5,0-3,0-3.25-2-3.25-2"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.25" cy="5" fill={fill} r=".75" />
        <circle cx="10.75" cy="5.5" fill={fill} r=".75" />
      </g>
    </svg>
  );
}

export default burger;
