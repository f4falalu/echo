import React from 'react';

import { iconProps } from './iconProps';

function gripDotsVertical(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'grip dots vertical';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="6.75" cy="9" fill={secondaryfill} r="1.25" />
        <circle cx="6.75" cy="3.75" fill={fill} r="1.25" />
        <circle cx="6.75" cy="14.25" fill={fill} r="1.25" />
        <circle cx="11.25" cy="9" fill={secondaryfill} r="1.25" />
        <circle cx="11.25" cy="3.75" fill={fill} r="1.25" />
        <circle cx="11.25" cy="14.25" fill={fill} r="1.25" />
      </g>
    </svg>
  );
}

export default gripDotsVertical;
