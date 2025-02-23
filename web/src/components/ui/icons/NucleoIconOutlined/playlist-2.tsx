import React from 'react';
import { iconProps } from './iconProps';

function playlist2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px playlist 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.715,8.482l-2.308-1.385c-.403-.242-.916,.048-.916,.518v2.771c0,.47,.513,.76,.916,.518l2.308-1.385c.391-.235,.391-.802,0-1.037Z"
          fill={secondaryfill}
        />
        <path
          d="M3,13.75h-.25c-.828,0-1.5-.672-1.5-1.5V5.75c0-.828,.672-1.5,1.5-1.5h.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.75h.25c.828,0,1.5-.672,1.5-1.5V5.75c0-.828-.672-1.5-1.5-1.5h-.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="5.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default playlist2;
