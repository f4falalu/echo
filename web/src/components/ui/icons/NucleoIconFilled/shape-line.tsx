import React from 'react';

import { iconProps } from './iconProps';

function shapeLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'shape line';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.72,2.22L2.22,14.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22L15.78,3.28c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default shapeLine;
