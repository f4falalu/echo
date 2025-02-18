import React from 'react';

import { iconProps } from './iconProps';

function shareUpLeft2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'share up left 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.47,9.53c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L4.561,3.5h2.939c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75V7.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.939l4.97,4.97Z"
          fill={secondaryfill}
        />
        <path
          d="M13.25,4h-2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.75c.689,0,1.25,.561,1.25,1.25v6.5c0,.689-.561,1.25-1.25,1.25H6.75c-.689,0-1.25-.561-1.25-1.25v-2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.75c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V6.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default shareUpLeft2;
