import React from 'react';
import { iconProps } from './iconProps';

function arrowBoldLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px arrow bold left';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.448,3.609L1.867,8.602c-.264,.2-.264,.597,0,.797l6.581,4.993c.329,.25,.802,.015,.802-.398v-2.743h6c.552,0,1-.448,1-1v-2.5c0-.552-.448-1-1-1h-6v-2.743c0-.413-.473-.648-.802-.398Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default arrowBoldLeft;
