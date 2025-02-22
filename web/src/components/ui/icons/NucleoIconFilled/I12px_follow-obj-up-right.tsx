import React from 'react';

import { iconProps } from './iconProps';

function I12px_followObjUpRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px follow obj up right';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m5.25,6H1.5c-.414,0-.75.336-.75.75s.336.75.75.75h1.939L.487,10.452c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.952-2.952v1.939c0,.414.336.75.75.75s.75-.336.75-.75v-3.75c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="6" y="0" />
      </g>
    </svg>
  );
}

export default I12px_followObjUpRight;
