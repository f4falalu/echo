import React from 'react';

import { iconProps } from './iconProps';

function chatBubbleForward(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'chat bubble forward';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.75,2H4.25c-1.519,0-2.75,1.231-2.75,2.75v1.75c0,.552,.448,1,1,1h6.439l-1.22-1.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.5,2.5c.293,.293,.293,.768,0,1.061l-2.5,2.5c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.22-1.22H2.5c-.552,0-1,.448-1,1v6.25c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h7.487c1.519,0,2.75-1.231,2.75-2.75V4.75c0-1.519-1.231-2.75-2.75-2.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default chatBubbleForward;
