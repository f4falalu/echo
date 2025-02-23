import React from 'react';

import { iconProps } from './iconProps';

function I12px_expandObj(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px expand obj';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m1.25,5c-.414,0-.75-.336-.75-.75v-2.25c0-.827.673-1.5,1.5-1.5h2.25c.414,0,.75.336.75.75s-.336.75-.75.75h-2.25v2.25c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m10,11.5h-2.25c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.25v-2.25c0-.414.336-.75.75-.75s.75.336.75.75v2.25c0,.827-.673,1.5-1.5,1.5Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="6" width="6" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="3" y="3" />
      </g>
    </svg>
  );
}

export default I12px_expandObj;
