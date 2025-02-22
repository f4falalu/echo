import React from 'react';

import { iconProps } from './iconProps';

function chartColumn(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'chart column';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,12.5c-.414,0-.75-.336-.75-.75V3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V11.75c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M6.25,12.5c-.414,0-.75-.336-.75-.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M9.75,12.5c-.414,0-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M15.25,15.5H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default chartColumn;
