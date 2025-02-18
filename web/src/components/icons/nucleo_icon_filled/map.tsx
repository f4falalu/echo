import React from 'react';

import { iconProps } from './iconProps';

function map(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'map';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.5,2.149l-3.129,.695c-.807,.179-1.371,.882-1.371,1.708V13.003c0,.534,.239,1.031,.655,1.365s.953,.46,1.475,.343l2.371-.526V2.149Z"
          fill={fill}
        />
        <path d="M11 3.679L7 2.224 7 14.321 11 15.776 11 3.679z" fill={secondaryfill} />
        <path
          d="M16.345,3.632c-.416-.334-.953-.46-1.475-.343l-2.371,.526V15.851l3.129-.695c.807-.179,1.371-.882,1.371-1.708V4.997c0-.534-.239-1.031-.655-1.365Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default map;
