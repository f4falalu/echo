import React from 'react';
import { iconProps } from './iconProps';

function transform(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px transform';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.106,1.82l8.5,3.238c.388,.148,.644,.52,.644,.934v6.02c0,.415-.256,.787-.644,.934l-8.5,3.238c-.655,.249-1.356-.234-1.356-.934V2.754c0-.7,.701-1.184,1.356-.934Z"
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

export default transform;
