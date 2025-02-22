import React from 'react';

import { iconProps } from './iconProps';

function magnifierPlus(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'magnifier plus';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.25,16c-.192,0-.384-.073-.53-.22l-3.965-3.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.965,3.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
        <path
          d="M7.75,2c-3.17,0-5.75,2.58-5.75,5.75s2.58,5.75,5.75,5.75,5.75-2.58,5.75-5.75S10.92,2,7.75,2Zm2.25,6.5h-1.5v1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default magnifierPlus;
