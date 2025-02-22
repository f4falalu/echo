import React from 'react';

import { iconProps } from './iconProps';

function I12px_followObjDownRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px follow obj down right';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m5.25.75c-.414,0-.75.336-.75.75v1.939L1.548.487C1.255.194.78.194.487.487S.194,1.255.487,1.548l2.952,2.952h-1.939c-.414,0-.75.336-.75.75s.336.75.75.75h3.75c.414,0,.75-.336.75-.75V1.5c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="6" y="6" />
      </g>
    </svg>
  );
}

export default I12px_followObjDownRight;
