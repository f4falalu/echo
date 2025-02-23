import React from 'react';

import { iconProps } from './iconProps';

function basement(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'basement';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,1H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75Zm1.25,9v2H7.5v-2h7Zm-3.5-1.5v-2h3.5v2h-3.5Zm2.25,7H4.75c-.689,0-1.25-.561-1.25-1.25v-.75H14.5v.75c0,.689-.561,1.25-1.25,1.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default basement;
