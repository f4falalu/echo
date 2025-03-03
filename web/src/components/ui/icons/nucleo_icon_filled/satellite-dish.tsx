import React from 'react';

import { iconProps } from './iconProps';

function satelliteDish(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'satellite dish';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.25,4c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c1.241,0,2.25,1.009,2.25,2.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.068-1.682-3.75-3.75-3.75Z"
          fill={secondaryfill}
        />
        <path
          d="M10.25,1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c2.895,0,5.25,2.355,5.25,5.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-3.722-3.028-6.75-6.75-6.75Z"
          fill={secondaryfill}
        />
        <path
          d="M9.061,10l1.47-1.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.47,1.47-3.889-3.889c-.293-.293-.768-.293-1.061,0C.321,7.78,.321,12.22,3.05,14.95c1.365,1.365,3.157,2.047,4.95,2.047s3.585-.682,4.95-2.047c.293-.293,.293-.768,0-1.061l-3.889-3.889Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default satelliteDish;
