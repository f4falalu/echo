import React from 'react';
import { iconProps } from './iconProps';

function inputPasswordXmark(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px input password xmark';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="5.5" cy="9" fill={fill} r="1" />
        <circle cx="9" cy="9" fill={fill} r="1" />
        <circle cx="12.5" cy="9" fill={fill} r="1" />
        <path
          d="M12.75 11.75L16.75 15.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9.302v-2.552c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v4.5c0,1.104,.895,2,2,2h7.014"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.75 11.75L12.75 15.75"
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

export default inputPasswordXmark;
