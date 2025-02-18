import React from 'react';

import { iconProps } from './iconProps';

function penWriting(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'pen writing';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.25,16h-6.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <path
          d="M11.414,2.848L3.605,10.657c-.863,.864-1.401,3.406-1.593,4.459-.044,.242,.034,.491,.208,.665,.142,.142,.333,.22,.53,.22,.044,0,.089-.004,.134-.012,1.053-.191,3.595-.729,4.459-1.593l7.809-7.809c1.03-1.031,1.03-2.707,0-3.738-.998-.998-2.739-.997-3.738,0Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default penWriting;
