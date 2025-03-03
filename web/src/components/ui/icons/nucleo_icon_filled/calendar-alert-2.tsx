import React from 'react';

import { iconProps } from './iconProps';

function calendarAlert2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'calendar alert 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
        <path
          d="M9,14.75c-.414,0-.75-.336-.75-.75v-2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2c-.689,0-1.25-.561-1.25-1.25V7H15v6.25c0,.689-.561,1.25-1.25,1.25h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
        <circle cx="9" cy="16.25" fill={secondaryfill} r=".75" />
      </g>
    </svg>
  );
}

export default calendarAlert2;
