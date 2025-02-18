import React from 'react';

import { iconProps } from './iconProps';

function threeArrowsUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'three arrows up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M4.78,9.72c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.97-.97v3.189c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.189l.97,.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill={fill}
        />
        <path
          d="M11.25,5.75c.192,0,.384-.073,.53-.22,.293-.293,.293-.768,0-1.061l-2.25-2.25c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.97-.97V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.561l.97,.97c.146,.146,.338,.22,.53,.22Z"
          fill={secondaryfill}
        />
        <path
          d="M14.28,6.72c-.293-.293-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.97-.97v6.189c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.189l.97,.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default threeArrowsUp;
