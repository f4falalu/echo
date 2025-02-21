import React from 'react';

import { iconProps } from './iconProps';

function form(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'form';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="5" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="4.5" />
        <rect height="5" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="11" />
        <path
          d="M3.75,3H7.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default form;
