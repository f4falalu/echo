import React from 'react';

import { iconProps } from './iconProps';

function copy(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'copy';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.25,16H3.75c-1.517,0-2.75-1.233-2.75-2.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.689,.561,1.25,1.25,1.25H12.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <rect height="11" width="13" fill={fill} rx="2.75" ry="2.75" x="4" y="2" />
      </g>
    </svg>
  );
}

export default copy;
