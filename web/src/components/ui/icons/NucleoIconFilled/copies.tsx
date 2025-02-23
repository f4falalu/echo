import React from 'react';

import { iconProps } from './iconProps';

function copies(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'copies';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="9" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="7" />
        <path
          d="M3.25,6.5c.414,0,.75-.336,.75-.75,0-.138,.112-.25,.25-.25H13.75c.138,0,.25,.112,.25,.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965-.785-1.75-1.75-1.75H4.25c-.965,0-1.75,.785-1.75,1.75,0,.414,.336,.75,.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M3.75,3.5c.414,0,.75-.336,.75-.75,0-.138,.112-.25,.25-.25H13.25c.138,0,.25,.112,.25,.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965-.785-1.75-1.75-1.75H4.75c-.965,0-1.75,.785-1.75,1.75,0,.414,.336,.75,.75,.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default copies;
