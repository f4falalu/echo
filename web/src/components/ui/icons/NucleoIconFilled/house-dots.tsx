import React from 'react';

import { iconProps } from './iconProps';

function houseDots(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'house dots';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="13" cy="15" fill={secondaryfill} r="1" />
        <circle cx="10" cy="15" fill={secondaryfill} r="1" />
        <circle cx="16" cy="15" fill={secondaryfill} r="1" />
        <path
          d="M11.5,16.987c-.005,.004-.01,.009-.015,.013h.031c-.005-.004-.01-.009-.015-.013Z"
          fill={secondaryfill}
        />
        <path
          d="M7.5,15c0-1.378,1.122-2.5,2.5-2.5,.565,0,1.081,.196,1.5,.513,.419-.317,.935-.513,1.5-.513s1.081,.196,1.5,.513c.419-.317,.935-.513,1.5-.513V6.996c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h3.765c-.613-.456-1.015-1.179-1.015-2Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default houseDots;
