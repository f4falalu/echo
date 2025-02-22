import React from 'react';

import { iconProps } from './iconProps';

function hourglass(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'hourglass';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,15h-.261c-.056-2.751-.457-4.593-1.989-6,1.532-1.407,1.932-3.249,1.989-6h.261c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.261c.056,2.751,.457,4.593,1.989,6-1.532,1.407-1.932,3.249-1.989,6h-.261c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default hourglass;
