import React from 'react';

import { iconProps } from './iconProps';

function squareUser(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'square user';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="7.75" fill={secondaryfill} r="2.75" />
        <path
          d="M4.381,15.213c.12,.022,.243,.037,.369,.037H13.25c.126,0,.249-.015,.369-.037-.003-.051-.006-.101-.019-.15-.54-2.098-2.432-3.563-4.6-3.563s-4.06,1.465-4.6,3.563c-.013,.049-.017,.099-.019,.15Z"
          fill={secondaryfill}
        />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM4.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareUser;
