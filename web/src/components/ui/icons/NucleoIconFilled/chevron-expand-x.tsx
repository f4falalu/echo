import React from 'react';

import { iconProps } from './iconProps';

function chevronExpandX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'chevron expand x';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.28,4.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.97,2.97-2.97,2.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.5-3.5c.293-.293,.293-.768,0-1.061l-3.5-3.5Z"
          fill={secondaryfill}
        />
        <path
          d="M6.78,4.97c-.293-.293-.768-.293-1.061,0l-3.5,3.5c-.293,.293-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.97-2.97,2.97-2.97c.293-.293,.293-.768,0-1.061Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default chevronExpandX;
