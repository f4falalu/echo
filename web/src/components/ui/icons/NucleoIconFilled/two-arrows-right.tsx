import React from 'react';

import { iconProps } from './iconProps';

function twoArrowsRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'two arrows right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M12.78,2.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.72,1.72H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.439l-1.72,1.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061l-3-3Z"
          fill={secondaryfill}
        />
        <path
          d="M8.28,8.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.72,1.72H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.189l-1.72,1.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3-3c.293-.293,.293-.768,0-1.061l-3-3Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default twoArrowsRight;
