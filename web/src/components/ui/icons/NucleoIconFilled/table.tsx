import React from 'react';

import { iconProps } from './iconProps';

function table(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'table';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M6.5,6h10.5v-1.25c0-1.517-1.233-2.75-2.75-2.75H6.5V6Z" fill={fill} />
        <path d="M1 7.5H5V10.5H1z" fill={secondaryfill} />
        <path d="M6.5 7.5H17V10.5H6.5z" fill={fill} />
        <path d="M6.5,12v4h7.75c1.517,0,2.75-1.233,2.75-2.75v-1.25H6.5Z" fill={fill} />
        <path d="M5,12H1v1.25c0,1.517,1.233,2.75,2.75,2.75h1.25v-4Z" fill={secondaryfill} />
        <path d="M5,6V2h-1.25c-1.517,0-2.75,1.233-2.75,2.75v1.25H5Z" fill={secondaryfill} />
      </g>
    </svg>
  );
}

export default table;
