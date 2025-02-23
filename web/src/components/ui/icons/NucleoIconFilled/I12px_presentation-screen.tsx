import React from 'react';

import { iconProps } from './iconProps';

function I12px_presentationScreen(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '12px presentation screen';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m3,11.75c-.107,0-.215-.023-.318-.071-.375-.176-.536-.623-.36-.998l1.292-2.75c.176-.375.622-.537.998-.36.375.176.536.623.36.998l-1.292,2.75c-.127.272-.397.431-.679.431Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m9,11.75c-.282,0-.552-.159-.679-.431l-1.292-2.75c-.176-.375-.015-.822.36-.998.374-.176.822-.016.998.36l1.292,2.75c.176.375.015.822-.36.998-.103.048-.211.071-.318.071Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m6,2.5c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v1c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <rect height="8" width="11" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" x=".5" y="1" />
      </g>
    </svg>
  );
}

export default I12px_presentationScreen;
