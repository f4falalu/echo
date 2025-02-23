import React from 'react';

import { iconProps } from './iconProps';

function I12px_house(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px house';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.738,2.881L6.988.315c-.6-.41-1.376-.41-1.976,0L1.262,2.881s0,0,0,0c-.477.326-.762.866-.762,1.444v4.425c0,1.516,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.234,2.75-2.75v-4.425c0-.578-.285-1.118-.762-1.444Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_house;
