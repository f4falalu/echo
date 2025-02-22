import React from 'react';

import { iconProps } from './iconProps';

function headphones3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'headphones 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.5,8c-1.103,0-2,.897-2,2v4c0,1.103,.897,2,2,2s2-.897,2-2v-4c0-1.103-.897-2-2-2Z"
          fill={fill}
        />
        <path
          d="M10.25,1h-2.5C4.028,1,1,4.028,1,7.75v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.75c0-2.895,2.355-5.25,5.25-5.25h2.5c2.895,0,5.25,2.355,5.25,5.25v4.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.75c0-3.722-3.028-6.75-6.75-6.75Z"
          fill={secondaryfill}
        />
        <path
          d="M12.5,8c-1.103,0-2,.897-2,2v4c0,1.103,.897,2,2,2s2-.897,2-2v-4c0-1.103-.897-2-2-2Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default headphones3;
