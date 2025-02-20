import React from 'react';

import { iconProps } from './iconProps';

function material(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'material';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M15.159,3.901L3.901,15.159c.73,.605,1.572,1.076,2.485,1.394L16.553,6.387c-.317-.914-.788-1.755-1.394-2.485Z"
          fill={fill}
        />
        <path
          d="M11.613,1.447L1.447,11.614c.317,.913,.788,1.755,1.393,2.485L14.099,2.841c-.73-.605-1.572-1.076-2.485-1.394Z"
          fill={secondaryfill}
        />
        <path
          d="M9.887,1.052c-.292-.032-.587-.052-.887-.052C4.589,1,1,4.589,1,9c0,.3,.02,.596,.052,.888L9.887,1.052Z"
          fill={fill}
        />
        <path
          d="M8.112,16.948c.292,.032,.587,.052,.888,.052,4.411,0,8-3.589,8-8,0-.3-.02-.596-.052-.887l-8.835,8.835Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default material;
