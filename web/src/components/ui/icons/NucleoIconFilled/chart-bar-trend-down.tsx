import React from 'react';

import { iconProps } from './iconProps';

function chartBarTrendDown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'chart bar trend down';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="14" width="4" fill={fill} rx="1.75" ry="1.75" x="1.5" y="2" />
        <rect height="9" width="4" fill={fill} rx="1.75" ry="1.75" x="7" y="7" />
        <rect height="5" width="4" fill={fill} rx="1.75" ry="1.75" x="12.5" y="11" />
        <path
          d="M15.25,9.5c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.689L9.78,2.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l4.72,4.72h-.689c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default chartBarTrendDown;
