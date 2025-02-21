import React from 'react';

import { iconProps } from './iconProps';

function followObjDownRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'follow obj down right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7.75,2.49c-.414,0-.75,.336-.75,.75v2.7L3.28,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.72,3.72H3.24c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7.75c.414,0,.75-.336,.75-.75V3.24c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <rect height="7" width="7" fill={fill} rx="1.75" ry="1.75" x="9" y="9" />
      </g>
    </svg>
  );
}

export default followObjDownRight;
