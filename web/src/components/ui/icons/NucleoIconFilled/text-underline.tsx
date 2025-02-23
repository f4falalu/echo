import React from 'react';

import { iconProps } from './iconProps';

function textUnderline(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'text underline';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,13c-2.481,0-4.5-2.019-4.5-4.5V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.75c0,1.654,1.346,3,3,3s3-1.346,3-3V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v5.75c0,2.481-2.019,4.5-4.5,4.5Z"
          fill={fill}
        />
        <path
          d="M15.25,16H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default textUnderline;
