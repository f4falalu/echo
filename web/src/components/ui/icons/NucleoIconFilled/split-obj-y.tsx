import React from 'react';

import { iconProps } from './iconProps';

function splitObjY(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'split obj y';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,16h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.689,0,1.25-.561,1.25-1.25v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,1.517-1.233,2.75-2.75,2.75Z"
          fill={secondaryfill}
        />
        <path
          d="M6.75,16h-2c-1.517,0-2.75-1.233-2.75-2.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.689,.561,1.25,1.25,1.25h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M16.75,8h-.75v-3.25c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75v3.25h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h15.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default splitObjY;
