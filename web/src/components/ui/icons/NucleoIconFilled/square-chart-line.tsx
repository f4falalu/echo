import React from 'react';

import { iconProps } from './iconProps';

function squareChartLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'square chart line';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm.03,6.28l-2.146,2.146c-.486,.487-1.281,.487-1.768,0l-1.616-1.616-1.97,1.97c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l2.146-2.146c.486-.487,1.281-.487,1.768,0l1.616,1.616,1.97-1.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareChartLine;
