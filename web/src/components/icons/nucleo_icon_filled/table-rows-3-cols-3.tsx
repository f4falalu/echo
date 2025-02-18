import React from 'react';

import { iconProps } from './iconProps';

function tableRows3Cols3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'table rows 3 cols 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M7 2H11V6H7z" fill={secondaryfill} />
        <path d="M1 7.5H5.5V10.5H1z" fill={secondaryfill} />
        <path d="M7 12H11V16H7z" fill={secondaryfill} />
        <path d="M12.5 7.5H17V10.5H12.5z" fill={secondaryfill} />
        <path d="M7 7.5H11V10.5H7z" fill={fill} />
        <path d="M12.5,12v4h1.75c1.517,0,2.75-1.233,2.75-2.75v-1.25h-4.5Z" fill={fill} />
        <path d="M5.5,12H1v1.25c0,1.517,1.233,2.75,2.75,2.75h1.75v-4Z" fill={fill} />
        <path d="M5.5,6V2h-1.75c-1.517,0-2.75,1.233-2.75,2.75v1.25H5.5Z" fill={fill} />
        <path d="M12.5,6h4.5v-1.25c0-1.517-1.233-2.75-2.75-2.75h-1.75V6Z" fill={fill} />
      </g>
    </svg>
  );
}

export default tableRows3Cols3;
