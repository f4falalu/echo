import React from 'react';

import { iconProps } from './iconProps';

function ballGolf(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'ball golf';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.25,14H6.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13.242,2.757c-1.133-1.133-2.64-1.757-4.242-1.757s-3.109,.624-4.242,1.757c-1.134,1.133-1.758,2.64-1.758,4.243s.624,3.109,1.758,4.243c1.133,1.133,2.64,1.757,4.242,1.757s3.109-.624,4.242-1.757c1.134-1.133,1.758-2.64,1.758-4.243s-.624-3.109-1.758-4.243ZM7.25,7c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1.75-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm1.75,2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default ballGolf;
