import React from 'react';

import { iconProps } from './iconProps';

function lipstick(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'lipstick';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.75,8.5c-.414,0-.75-.336-.75-.75V2.292l-2,1.143V7.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V3.29c0-.448,.242-.865,.631-1.086l2.499-1.428c.393-.223,.858-.221,1.247,.004,.391,.226,.623,.63,.623,1.082V7.75c0,.414-.336,.75-.75,.75ZM7.875,3.507h0Z"
          fill={secondaryfill}
        />
        <path
          d="M13,10.176v-1.426c0-.965-.785-1.75-1.75-1.75H6.75c-.965,0-1.75,.785-1.75,1.75v1.426c-.589,.282-1,.879-1,1.574v2.5c0,1.517,1.233,2.75,2.75,2.75h4.5c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.695-.411-1.292-1-1.574Zm-6.5-.176v-1.25c0-.138,.112-.25,.25-.25h4.5c.138,0,.25,.112,.25,.25v1.25H6.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default lipstick;
