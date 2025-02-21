import React from 'react';
import { iconProps } from './iconProps';

function pinB(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px pin b';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.779,7.266c0,2.622-3.428,6.833-5.004,8.631-.413,.471-1.139,.471-1.551,0-1.576-1.797-5.004-6.008-5.004-8.631C3.221,3.776,6.207,1.75,9,1.75s5.779,2.026,5.779,5.516Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.233,8h2.642c.76,0,1.376,.617,1.375,1.377h0c-.001,.759-.616,1.373-1.375,1.373h-2.643l.004-5.5h2.405c.759,0,1.375,.616,1.375,1.375h0c0,.759-.616,1.375-1.375,1.375"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default pinB;
