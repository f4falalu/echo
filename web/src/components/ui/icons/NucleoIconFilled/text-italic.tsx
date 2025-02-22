import React from 'react';

import { iconProps } from './iconProps';

function textItalic(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'text italic';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="12" cy="2" fill={secondaryfill} r="1" />
        <path
          d="M10.75,13.5h-1.497l2.217-7.539c.066-.227,.022-.472-.119-.661-.142-.189-.364-.301-.601-.301h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.498l-2.059,7h-1.939c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default textItalic;
