import React from 'react';

import { iconProps } from './iconProps';

function I12px_link4(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '12px';
  const title = props.title || '12px link 4';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m6,12c-2.206,0-4-1.794-4-4v-.5c0-.414.336-.75.75-.75s.75.336.75.75v.5c0,1.378,1.122,2.5,2.5,2.5s2.5-1.122,2.5-2.5v-.5c0-.414.336-.75.75-.75s.75.336.75.75v.5c0,2.206-1.794,4-4,4Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9.25,5.25c-.414,0-.75-.336-.75-.75v-.5c0-1.378-1.122-2.5-2.5-2.5s-2.5,1.122-2.5,2.5v.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75v-.5C2,1.794,3.794,0,6,0s4,1.794,4,4v.5c0,.414-.336.75-.75.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m6,9c-.414,0-.75-.336-.75-.75V3.75c0-.414.336-.75.75-.75s.75.336.75.75v4.5c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_link4;
