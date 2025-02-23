import React from 'react';

import { iconProps } from './iconProps';

function chatBubbleFlag(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'chat bubble flag';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.5,10.25c0-1.517,1.233-2.75,2.75-2.75h3.25v-2.75c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h4.237v-3.75Z"
          fill={fill}
        />
        <path
          d="M16.75,9h-3.5c-.689,0-1.25,.561-1.25,1.25v6c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h3.25c.689,0,1.25-.561,1.25-1.25v-2c0-.689-.561-1.25-1.25-1.25Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default chatBubbleFlag;
