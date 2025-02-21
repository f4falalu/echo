import React from 'react';

import { iconProps } from './iconProps';

function layersStacked(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'layers stacked';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.25,7H4.25c-.199,0-.39,.079-.53,.22l-2.5,2.5c-.214,.214-.279,.537-.163,.817s.39,.463,.693,.463H13.75c.199,0,.39-.079,.53-.22l2.5-2.5c.214-.214,.279-.537,.163-.817s-.39-.463-.693-.463Z"
          fill={secondaryfill}
        />
        <path
          d="M16.25,2H4.25c-.199,0-.39,.079-.53,.22L1.22,4.72c-.214,.214-.279,.537-.163,.817s.39,.463,.693,.463H13.75c.199,0,.39-.079,.53-.22l2.5-2.5c.214-.214,.279-.537,.163-.817s-.39-.463-.693-.463Z"
          fill={fill}
        />
        <path
          d="M16.25,12H4.25c-.199,0-.39,.079-.53,.22l-2.5,2.5c-.214,.214-.279,.537-.163,.817s.39,.463,.693,.463H13.75c.199,0,.39-.079,.53-.22l2.5-2.5c.214-.214,.279-.537,.163-.817s-.39-.463-.693-.463Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default layersStacked;
