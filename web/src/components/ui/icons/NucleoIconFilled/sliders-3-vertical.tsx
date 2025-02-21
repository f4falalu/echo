import React from 'react';

import { iconProps } from './iconProps';

function sliders3Vertical(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'sliders 3 vertical';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,14c-.414,0-.75,.336-.75,.75v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1c0-.414-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M11,11h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V11h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13.75,8.5c-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.5c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M15.75,5.5h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M4.25,8.5c-.414,0-.75,.336-.75,.75v6.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-6.5c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M7,6.25c0-.414-.336-.75-.75-.75h-1.25V2.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v3.25h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H6.25c.414,0,.75-.336,.75-.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default sliders3Vertical;
