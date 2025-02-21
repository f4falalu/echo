import React from 'react';

import { iconProps } from './iconProps';

function empty(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'empty';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.91,15.271c.933,.462,1.98,.729,3.09,.729,3.86,0,7-3.14,7-7,0-1.11-.267-2.156-.728-3.09L5.91,15.271Z"
          fill={fill}
        />
        <path
          d="M13.947,4.053c-1.268-1.268-3.018-2.053-4.947-2.053-3.86,0-7,3.14-7,7,0,1.93,.785,3.68,2.053,4.947L13.947,4.053Z"
          fill={fill}
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default empty;
