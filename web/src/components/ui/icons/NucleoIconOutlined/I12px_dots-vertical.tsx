import React from 'react';
import { iconProps } from './iconProps';

function I12px_dotsVertical(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px dots vertical';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="6" cy="6" fill={secondaryfill} r="1" strokeWidth="0" />
        <circle cx="6" cy="2" fill={fill} r="1" strokeWidth="0" />
        <circle cx="6" cy="10" fill={fill} r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_dotsVertical;
