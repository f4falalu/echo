import React from 'react';
import { iconProps } from './iconProps';

function phoneSlash(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px phone slash';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.119,13.612c1.791,1.228,3.875,2.062,6.132,2.379,.489,.067,.952-.242,1.076-.719l.642-2.475c.119-.459-.111-.936-.544-1.129l-2.927-1.3c-.402-.179-.874-.064-1.15,.279l-1.141,1.426c-.155-.091-.309-.186-.459-.284"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.793,10.207c-.719-.719-1.347-1.529-1.866-2.412l1.426-1.141c.344-.275,.459-.748,.28-1.15l-1.3-2.927c-.193-.434-.671-.664-1.13-.545l-2.475,.642c-.478,.125-.787,.588-.719,1.077,.446,3.177,1.918,6.014,4.072,8.168"
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

export default phoneSlash;
