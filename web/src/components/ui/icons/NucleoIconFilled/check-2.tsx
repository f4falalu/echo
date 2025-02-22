import React from 'react';

import { iconProps } from './iconProps';

function check2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'check 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M6.5,14c-.192,0-.384-.073-.53-.22l-3.75-3.75c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.22,3.22L14.72,3.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L7.03,13.78c-.146,.146-.338,.22-.53,.22Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default check2;
