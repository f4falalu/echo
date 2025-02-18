import React from 'react';

import { iconProps } from './iconProps';

function I12px_penWriting(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || '12px pen writing';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m10.947,1.054c-.923-.924-2.534-.924-3.457,0L1.853,6.691c-.311.311-.535.699-.648,1.124l-.861,3.231c-.046.172.003.356.129.482.095.095.223.146.354.146.043,0,.086-.005.129-.017l3.231-.861c.425-.113.813-.337,1.124-.648l5.637-5.637c.462-.461.716-1.076.716-1.729s-.254-1.267-.716-1.729Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m11.25,11.501h-4c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_penWriting;
