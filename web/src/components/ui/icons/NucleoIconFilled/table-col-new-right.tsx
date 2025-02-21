import React from 'react';

import { iconProps } from './iconProps';

function tableColNewRight(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'table col new right';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17.25,8.25h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M15.132,13.263c-.386-.149-.821,.045-.969,.432-.188,.489-.644,.805-1.163,.805h-4V3.5h4c.519,0,.976,.316,1.163,.805,.148,.387,.583,.58,.969,.432,.387-.148,.58-.582,.432-.969-.412-1.074-1.418-1.768-2.563-1.768H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13c1.146,0,2.151-.694,2.563-1.768,.148-.387-.045-.82-.432-.969Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default tableColNewRight;
