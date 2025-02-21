import React from 'react';

import { iconProps } from './iconProps';

function magnifier2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'magnifier 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7.25,12.5c-2.895,0-5.25-2.355-5.25-5.25S4.355,2,7.25,2s5.25,2.355,5.25,5.25-2.355,5.25-5.25,5.25Zm0-9c-2.067,0-3.75,1.682-3.75,3.75s1.683,3.75,3.75,3.75,3.75-1.682,3.75-3.75-1.683-3.75-3.75-3.75Z"
          fill={fill}
        />
        <path
          d="M15.25,16c-.192,0-.384-.073-.53-.22l-2.965-2.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.965,2.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default magnifier2;
