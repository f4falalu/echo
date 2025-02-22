import React from 'react';

import { iconProps } from './iconProps';

function arrowsExpand(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'arrows expand';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7.75,2.75c0-.414-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.439l2.97,2.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.97-2.97h2.439c.414,0,.75-.336,.75-.75Z"
          fill={fill}
        />
        <path
          d="M15.25,10.25c-.414,0-.75,.336-.75,.75v2.439l-2.97-2.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.97,2.97h-2.439c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.25c.414,0,.75-.336,.75-.75v-4.25c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M15.25,2h-4.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.439l-2.97,2.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.97-2.97v2.439c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M7.53,10.47c-.293-.293-.768-.293-1.061,0l-2.97,2.97v-2.439c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.25c0,.414,.336,.75,.75,.75H7c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.439l2.97-2.97c.293-.293,.293-.768,0-1.061Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default arrowsExpand;
