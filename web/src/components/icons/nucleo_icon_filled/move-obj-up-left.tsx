import React from 'react';

import { iconProps } from './iconProps';

function moveObjUpLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'move obj up left';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.561,3.5h2.7c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7.26c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.7l3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.72-3.72Z"
          fill={secondaryfill}
        />
        <rect height="7" width="7" fill={fill} rx="1.75" ry="1.75" x="9" y="9" />
      </g>
    </svg>
  );
}

export default moveObjUpLeft;
