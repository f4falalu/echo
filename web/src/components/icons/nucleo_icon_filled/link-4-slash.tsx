import React from 'react';

import { iconProps } from './iconProps';

function link4Slash(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'link 4 slash';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
        <path
          d="M9,17c-1.239,0-2.389-.561-3.152-1.538-.255-.326-.197-.798,.129-1.053,.326-.257,.798-.197,1.053,.129,.478,.611,1.196,.962,1.971,.962,1.379,0,2.5-1.122,2.5-2.5v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25c0,2.206-1.794,4-4,4Z"
          fill={fill}
        />
        <path
          d="M5.75,8c-.414,0-.75-.336-.75-.75v-2.25c0-2.206,1.794-4,4-4,1.239,0,2.389,.561,3.152,1.538,.255,.326,.197,.798-.129,1.053-.327,.256-.8,.197-1.053-.129-.478-.611-1.196-.962-1.971-.962-1.379,0-2.5,1.122-2.5,2.5v2.25c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default link4Slash;
