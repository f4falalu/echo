import React from 'react';

import { iconProps } from './iconProps';

function arrowTrendDown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'arrow trend down';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16,12.75c-.192,0-.384-.073-.53-.22l-5.72-5.72-3.116,3.116c-.487,.487-1.28,.487-1.768,0L1.22,6.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.47,3.47,3.116-3.116c.487-.487,1.28-.487,1.768,0l5.896,5.896c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
        <path
          d="M16.25,13h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.25V7.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default arrowTrendDown;
