import React from 'react';

import { iconProps } from './iconProps';

function textScaleY(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'text scale y';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10,4H1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.5h3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M16.22,13.72l-.72,.72V3.561l.72,.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2-2c-.293-.293-.768-.293-1.061,0l-2,2c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.72-.72V14.439l-.72-.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default textScaleY;
