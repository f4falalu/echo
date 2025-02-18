import React from 'react';

import { iconProps } from './iconProps';

function timelineVertical(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px timeline vertical';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="5" width="5" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="6" />
        <rect height="5" width="5" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x="6" y="7" />
        <path
          d="m3.75,8.5h-.75V3.5h.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-.75V.75c0-.414-.336-.75-.75-.75s-.75.336-.75.75v10.5c0,.414.336.75.75.75s.75-.336.75-.75v-1.25h.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default timelineVertical;
