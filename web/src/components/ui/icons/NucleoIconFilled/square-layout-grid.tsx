import React from 'react';

import { iconProps } from './iconProps';

function squareLayoutGrid(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'square layout grid';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M8.25,8.25V2h-3.5c-1.517,0-2.75,1.233-2.75,2.75v3.5h6.25Z" fill={fill} />
        <path
          d="M9.75,8.25h6.25v-3.5c0-1.517-1.233-2.75-2.75-2.75h-3.5v6.25Z"
          fill={secondaryfill}
        />
        <path d="M9.75,9.75v6.25h3.5c1.517,0,2.75-1.233,2.75-2.75v-3.5h-6.25Z" fill={fill} />
        <path d="M8.25,9.75H2v3.5c0,1.517,1.233,2.75,2.75,2.75h3.5v-6.25Z" fill={secondaryfill} />
      </g>
    </svg>
  );
}

export default squareLayoutGrid;
