import React from 'react';

import { iconProps } from './iconProps';

function tableRows2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px table rows 2';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m11.5,5.25v-2c0-1.517-1.233-2.75-2.75-2.75H3.25C1.733.5.5,1.733.5,3.25v2h11Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m.5,6.75v2c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75v-2H.5Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default tableRows2;
