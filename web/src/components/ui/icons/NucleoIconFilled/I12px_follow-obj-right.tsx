import React from 'react';

import { iconProps } from './iconProps';

function I12px_followObjRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px follow obj right';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m3.78,2.97c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l1.22,1.22H.75c-.414,0-.75.336-.75.75s.336.75.75.75h3.189l-1.22,1.22c-.293.293-.293.768,0,1.061.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061l-2.5-2.5Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="12" width="4.5" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="7.5" />
      </g>
    </svg>
  );
}

export default I12px_followObjRight;
