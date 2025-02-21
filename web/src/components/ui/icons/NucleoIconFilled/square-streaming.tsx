import React from 'react';

import { iconProps } from './iconProps';

function squareStreaming(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'square streaming';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.75,3.614c0-.473,.514-.768,.922-.53l2.375,1.386c.406,.237,.406,.823,0,1.06l-2.375,1.386c-.409,.239-.922-.056-.922-.53v-2.771Zm2,7.386c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-.5h-2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75v-.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5Zm3.25-.5h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareStreaming;
