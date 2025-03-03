import React from 'react';

import { iconProps } from './iconProps';

function gridCheck(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'grid check';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.162,2.042l-2.877,3.74-1.005-1.005c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.609,1.609c.141,.141,.332,.22,.53,.22,.016,0,.032,0,.049-.001,.215-.014,.414-.12,.545-.291l3.397-4.417c.253-.329,.191-.799-.137-1.052-.33-.253-.799-.191-1.052,.137Z"
          fill={secondaryfill}
        />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="2" y="10" />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="10" y="10" />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default gridCheck;
