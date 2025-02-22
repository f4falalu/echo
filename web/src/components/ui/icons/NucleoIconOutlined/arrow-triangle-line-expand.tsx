import React from 'react';
import { iconProps } from './iconProps';

function arrowTriangleLineExpand(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px arrow triangle line expand';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M2.75,11.104v3.896c0,.138,.112,.25,.25,.25h3.896c.223,0,.334-.269,.177-.427l-3.896-3.896c-.157-.157-.427-.046-.427,.177Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.125 12.875L7.25 10.75"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.104,2.75h3.896c.138,0,.25,.112,.25,.25v3.896c0,.223-.269,.334-.427,.177l-3.896-3.896c-.157-.157-.046-.427,.177-.427Z"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.875 5.125L10.75 7.25"
          fill="none"
          stroke={secondaryfill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,11.104v3.896c0,.138-.112,.25-.25,.25h-3.896c-.223,0-.334-.269-.177-.427l3.896-3.896c.157-.157,.427-.046,.427,.177Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.875 12.875L10.75 10.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.896,2.75H3c-.138,0-.25,.112-.25,.25v3.896c0,.223,.269,.334,.427,.177l3.896-3.896c.157-.157,.046-.427-.177-.427Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.125 5.125L7.25 7.25"
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

export default arrowTriangleLineExpand;
