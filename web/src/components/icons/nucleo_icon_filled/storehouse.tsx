import React from 'react';

import { iconProps } from './iconProps';

function storehouse(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'storehouse';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17,13.5V4.75c0-.965-.785-1.75-1.75-1.75H2.75c-.965,0-1.75,.785-1.75,1.75V13.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H17c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-7.25-5.5h2.25v5.5h-2.25v-5.5Zm-1.5,5.5h-2.25v-5.5h2.25v5.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default storehouse;
