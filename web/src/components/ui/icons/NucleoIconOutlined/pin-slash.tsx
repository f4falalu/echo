import React from 'react';
import { iconProps } from './iconProps';

function pinSlash(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px pin slash';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.526,12.474c-1.226-1.765-2.305-3.736-2.305-5.208C3.221,3.776,6.207,1.75,9,1.75c1.819,0,3.721,.86,4.826,2.424"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.759,6.776c.013,.16,.02,.323,.02,.49,0,2.622-3.428,6.833-5.004,8.631-.413,.471-1.139,.471-1.551,0-.329-.375-.739-.856-1.181-1.405"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.752,9.233c-.849-.12-1.502-.85-1.502-1.733,0-.966,.784-1.75,1.75-1.75,.887,0,1.62,.66,1.735,1.516"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
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

export default pinSlash;
