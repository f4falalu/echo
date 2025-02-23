import React from 'react';
import { iconProps } from './iconProps';

function positionRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px position right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect
          height="12.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.75"
          y="2.75"
        />
        <circle cx="9" cy="15.25" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="9" cy="2.75" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="9" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="5.875" cy="2.75" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="2.75" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="5.875" cy="15.25" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="15.25" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="12.125" fill={fill} r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="5.875" fill={fill} r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default positionRight;
