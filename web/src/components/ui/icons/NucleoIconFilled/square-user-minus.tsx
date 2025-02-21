import React from 'react';

import { iconProps } from './iconProps';

function squareUserMinus(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'square user minus';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M17.25,4h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M4.381,15.213c.12,.022,.243,.037,.369,.037H13.25c.126,0,.249-.015,.369-.037-.003-.051-.006-.101-.019-.15-.54-2.098-2.432-3.563-4.6-3.563s-4.06,1.465-4.6,3.563c-.013,.049-.017,.099-.019,.15Z"
          fill={secondaryfill}
        />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75h4.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H4.75c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V6c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v7.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill={fill}
        />
        <circle cx="9" cy="7.75" fill={secondaryfill} r="2.75" />
      </g>
    </svg>
  );
}

export default squareUserMinus;
