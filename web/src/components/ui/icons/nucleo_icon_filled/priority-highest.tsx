import React from 'react';

import { iconProps } from './iconProps';

function priorityHighest(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'priority highest';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.25,10c-.192,0-.384-.073-.53-.22l-5.72-5.72L3.28,9.78c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061L8.47,2.47c.293-.293,.768-.293,1.061,0l6.25,6.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill={fill}
        />
        <path
          d="M15.25,15c-.192,0-.384-.073-.53-.22l-5.72-5.72L3.28,14.78c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l6.25-6.25c.293-.293,.768-.293,1.061,0l6.25,6.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default priorityHighest;
