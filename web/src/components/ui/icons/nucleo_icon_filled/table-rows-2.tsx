import React from 'react';

import { iconProps } from './iconProps';

function tableRows2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'table rows 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M1 7H17V11H1z" fill={secondaryfill} />
        <path
          d="M17,5.5v-.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17Z"
          fill={fill}
        />
        <path
          d="M1,12.5v.75c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-.75H1Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default tableRows2;
