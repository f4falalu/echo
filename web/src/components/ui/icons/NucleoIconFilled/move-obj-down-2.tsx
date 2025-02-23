import React from 'react';

import { iconProps } from './iconProps';

function moveObjDown2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'move obj down 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.72,12.22l-1.22,1.22V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V13.439l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={secondaryfill}
        />
        <path
          d="M3.75,8.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.25c-.138,0-.25-.112-.25-.25v-.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.25c0,.965,.785,1.75,1.75,1.75Z"
          fill={fill}
        />
        <path
          d="M2.75,4.75c.414,0,.75-.336,.75-.75v-.25c0-.138,.112-.25,.25-.25h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-.25c-.965,0-1.75,.785-1.75,1.75v.25c0,.414,.336,.75,.75,.75Z"
          fill={fill}
        />
        <path
          d="M6.75,2h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c.138,0,.25,.112,.25,.25v.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.25c0-.965-.785-1.75-1.75-1.75Z"
          fill={fill}
        />
        <path
          d="M7.75,5.75c-.414,0-.75,.336-.75,.75v.25c0,.138-.112,.25-.25,.25h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.25c.965,0,1.75-.785,1.75-1.75v-.25c0-.414-.336-.75-.75-.75Z"
          fill={fill}
        />
        <rect height="6.5" width="6.5" fill={fill} rx="1.75" ry="1.75" x="2" y="9.5" />
      </g>
    </svg>
  );
}

export default moveObjDown2;
