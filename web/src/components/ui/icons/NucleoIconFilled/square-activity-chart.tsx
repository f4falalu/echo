import React from 'react';

import { iconProps } from './iconProps';

function squareActivityChart(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'square activity chart';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.25,7.75h-.985l-1.064,2.769c-.111,.29-.39,.481-.7,.481s-.589-.191-.7-.481l-1.8-4.68-.55,1.43c-.111,.29-.39,.481-.7,.481h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.985l1.064-2.769c.223-.58,1.178-.58,1.4,0l1.8,4.68,.55-1.43c.111-.29,.39-.481,.7-.481h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareActivityChart;
