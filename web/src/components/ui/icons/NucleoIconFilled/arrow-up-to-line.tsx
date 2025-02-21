import React from 'react';

import { iconProps } from './iconProps';

function arrowUpToLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'arrow up to line';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.53,5.22c-.293-.293-.768-.293-1.061,0l-4,4c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l2.72-2.72v7.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.561l2.72,2.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-4-4Z"
          fill={fill}
        />
        <path
          d="M15.25,2H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default arrowUpToLine;
