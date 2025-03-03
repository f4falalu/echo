import React from 'react';

import { iconProps } from './iconProps';

function arrowsExpandDiagonal(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'arrows expand diagonal';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.25,2h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.689l-3.22,3.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.22-3.22v2.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M7.78,10.22c-.293-.293-.768-.293-1.061,0l-3.22,3.22v-2.689c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.5c0,.414,.336,.75,.75,.75H7.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.689l3.22-3.22c.293-.293,.293-.768,0-1.061Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal;
