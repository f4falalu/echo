import React from 'react';
import { iconProps } from './iconProps';

function penNib2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px pen nib 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.044 15.956L7.442 10.558"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.93,8.43l-1.88,5.309c-.117,.33-.397,.575-.74,.645l-8.583,1.776c-.528,.109-.996-.358-.886-.886L3.616,6.69c.071-.343,.316-.623,.645-.74l5.309-1.88"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,1.75l-.293,.293c-.391,.391-.391,1.024,0,1.414l5.586,5.586c.391,.391,1.024,.391,1.414,0l.293-.293"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7.973"
          cy="10.027"
          fill={secondaryfill}
          r=".75"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default penNib2;
