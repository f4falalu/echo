import React from 'react';

import { iconProps } from './iconProps';

function bag(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'bag';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.75,8.5c-.414,0-.75-.336-.75-.75v-3.25c0-1.103-.897-2-2-2s-2,.897-2,2v3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.25c0-1.93,1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5v3.25c0,.414-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M16.32,6.612c-.071-.904-.837-1.612-1.745-1.612H3.424c-.907,0-1.673,.708-1.745,1.612l-.507,6.421c-.06,.762,.203,1.521,.722,2.083s1.255,.884,2.02,.884H14.086c.765,0,1.5-.322,2.02-.884s.782-1.32,.722-2.083l-.507-6.421Zm-5.32,4.638c0,.414-.336,.75-.75,.75h-2.5c-.414,0-.75-.336-.75-.75v-.5c0-.414,.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75v.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default bag;
