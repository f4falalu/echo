import React from 'react';

import { iconProps } from './iconProps';

function circleChevronExpand2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'circle chevron expand 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm.25,11.5h-3c-.414,0-.75-.336-.75-.75v-3c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25h2.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm3.25-3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25h-2.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75v3Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default circleChevronExpand2;
