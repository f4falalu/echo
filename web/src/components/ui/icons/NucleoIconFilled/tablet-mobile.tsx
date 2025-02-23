import React from 'react';

import { iconProps } from './iconProps';

function tabletMobile(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'tablet mobile';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M7,13.5h-2.25c-.689,0-1.25-.561-1.25-1.25V3.75c0-.689,.561-1.25,1.25-1.25h6.5c.689,0,1.25,.561,1.25,1.25v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25c0-1.517-1.233-2.75-2.75-2.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V12.25c0,1.517,1.233,2.75,2.75,2.75h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <rect height="10" width="7" fill={secondaryfill} rx="2.25" ry="2.25" x="9" y="7" />
      </g>
    </svg>
  );
}

export default tabletMobile;
