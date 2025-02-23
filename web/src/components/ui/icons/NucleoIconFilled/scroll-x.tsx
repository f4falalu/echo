import React from 'react';

import { iconProps } from './iconProps';

function scrollX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'scroll x';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="9" fill={secondaryfill} r="3" />
        <path
          d="M4.78,5.72c-.293-.293-.768-.293-1.061,0L.97,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.22-2.22,2.22-2.22c.293-.293,.293-.768,0-1.061Z"
          fill={fill}
        />
        <path
          d="M14.28,5.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.22,2.22-2.22,2.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061l-2.75-2.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default scrollX;
