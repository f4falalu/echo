import React from 'react';

import { iconProps } from './iconProps';

function ballotRect(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'ballot rect';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="2" y="2" />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" x="2" y="10" />
        <path
          d="M10.25,6h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M15.25,12h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default ballotRect;
