import React from 'react';

import { iconProps } from './iconProps';

function followObjUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'follow obj up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.53,8.22c-.293-.293-.768-.293-1.061,0l-3.25,3.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.97-1.97v5.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-5.689l1.97,1.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-3.25-3.25Z"
          fill={secondaryfill}
        />
        <rect height="4.5" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default followObjUp;
