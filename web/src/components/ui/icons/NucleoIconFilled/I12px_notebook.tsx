import React from 'react';

import { iconProps } from './iconProps';

function I12px_notebook(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px notebook';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m4,.024c-1.313.121-2.354,1.162-2.475,2.476h-.775c-.414,0-.75.336-.75.75s.336.75.75.75h.75v1.25h-.75c-.414,0-.75.336-.75.75s.336.75.75.75h.75v1.25h-.75c-.414,0-.75.336-.75.75s.336.75.75.75h.775c.121,1.314,1.162,2.355,2.475,2.476V.024Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m8.25,0h-2.75v12h2.75c1.517,0,2.75-1.233,2.75-2.75V2.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_notebook;
