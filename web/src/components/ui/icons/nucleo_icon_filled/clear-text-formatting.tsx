import React from 'react';

import { iconProps } from './iconProps';

function clearTextFormatting(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'clear text formatting';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,16c-.414,0-.75-.336-.75-.75v-2.715c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.715c0,.414-.336,.75-.75,.75Z"
          fill={fill}
        />
        <path
          d="M14.25,2H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5v5.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.5h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={fill}
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default clearTextFormatting;
