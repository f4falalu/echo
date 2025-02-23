import React from 'react';

import { iconProps } from './iconProps';

function chartStackedBar(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'chart stacked bar';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.25,2h-.5c-.965,0-1.75,.785-1.75,1.75V14.25c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75V3.75c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v5.25h-1V3.75c0-.138,.112-.25,.25-.25Z"
          fill={fill}
        />
        <path
          d="M3.75,6h-.5c-.965,0-1.75,.785-1.75,1.75v6.5c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75V7.75c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v3.25h-1v-3.25c0-.138,.112-.25,.25-.25Z"
          fill={fill}
        />
        <path
          d="M14.75,8h-.5c-.965,0-1.75,.785-1.75,1.75v4.5c0,.965,.785,1.75,1.75,1.75h.5c.965,0,1.75-.785,1.75-1.75v-4.5c0-.965-.785-1.75-1.75-1.75Zm-.5,1.5h.5c.138,0,.25,.112,.25,.25v2.25h-1v-2.25c0-.138,.112-.25,.25-.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default chartStackedBar;
