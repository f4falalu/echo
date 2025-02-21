import React from 'react';

import { iconProps } from './iconProps';

function rectLayoutGrid4(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'rect layout grid 4';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M11,8H1v5.25c0,1.517,1.233,2.75,2.75,2.75h7.25V8Z" fill={fill} />
        <path
          d="M17,6.5v-1.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v1.75H17Z"
          fill={secondaryfill}
        />
        <path d="M12.5,8v8h1.75c1.517,0,2.75-1.233,2.75-2.75v-5.25h-4.5Z" fill={fill} />
      </g>
    </svg>
  );
}

export default rectLayoutGrid4;
