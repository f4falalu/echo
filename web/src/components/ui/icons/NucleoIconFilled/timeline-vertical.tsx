import React from 'react';

import { iconProps } from './iconProps';

function timelineVertical(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'timeline vertical';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="5" width="5" fill={fill} rx="1.75" ry="1.75" x="12.5" y="2" />
        <rect height="5" width="5" fill={fill} rx="1.75" ry="1.75" x="12.5" y="11" />
        <rect height="5" width="5" fill={fill} rx="1.75" ry="1.75" x=".5" y="6" />
        <path
          d="M9.75,5.5h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V7.5h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1v7.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1V5.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default timelineVertical;
