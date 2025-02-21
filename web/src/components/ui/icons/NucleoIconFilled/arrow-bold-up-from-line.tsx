import React from 'react';

import { iconProps } from './iconProps';

function arrowBoldUpFromLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'arrow bold up from line';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.441,6.971L9.978,1.366c-.478-.599-1.479-.599-1.956,0L3.559,6.972c-.301,.378-.358,.885-.148,1.321,.21,.436,.642,.707,1.126,.707h1.463v3.25c0,.965,.785,1.75,1.75,1.75h2.5c.965,0,1.75-.785,1.75-1.75v-3.25h1.463c.484,0,.916-.271,1.126-.707,.21-.437,.153-.943-.148-1.321h0Z"
          fill={fill}
        />
        <path
          d="M11.25,15.5H6.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default arrowBoldUpFromLine;
