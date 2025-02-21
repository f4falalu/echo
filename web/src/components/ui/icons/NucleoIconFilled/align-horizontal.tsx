import React from 'react';

import { iconProps } from './iconProps';

function alignHorizontal(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'align horizontal';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <rect height="5" width="12" fill={fill} rx="1.75" ry="1.75" x="3" y="10" />
        <rect height="5" width="8" fill={fill} rx="1.75" ry="1.75" x="5" y="3" />
      </g>
    </svg>
  );
}

export default alignHorizontal;
