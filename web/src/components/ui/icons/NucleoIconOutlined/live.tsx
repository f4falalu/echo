import React from 'react';
import { iconProps } from './iconProps';

function live(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px live';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="4.25"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="1.75" fill={secondaryfill} r=".75" />
        <circle cx="14.127" cy="3.873" fill={secondaryfill} r=".75" />
        <circle cx="16.25" cy="9" fill={secondaryfill} r=".75" />
        <circle cx="14.127" cy="14.127" fill={secondaryfill} r=".75" />
        <circle cx="9" cy="16.25" fill={secondaryfill} r=".75" />
        <circle cx="3.873" cy="14.127" fill={secondaryfill} r=".75" />
        <circle cx="1.75" cy="9" fill={secondaryfill} r=".75" />
        <circle cx="3.873" cy="3.873" fill={secondaryfill} r=".75" />
        <circle cx="11.774" cy="2.302" fill={secondaryfill} r=".75" />
        <circle cx="15.698" cy="6.226" fill={secondaryfill} r=".75" />
        <circle cx="15.698" cy="11.774" fill={secondaryfill} r=".75" />
        <circle cx="11.774" cy="15.698" fill={secondaryfill} r=".75" />
        <circle cx="6.226" cy="15.698" fill={secondaryfill} r=".75" />
        <circle cx="2.302" cy="11.774" fill={secondaryfill} r=".75" />
        <circle cx="2.302" cy="6.226" fill={secondaryfill} r=".75" />
        <circle cx="6.226" cy="2.302" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default live;
