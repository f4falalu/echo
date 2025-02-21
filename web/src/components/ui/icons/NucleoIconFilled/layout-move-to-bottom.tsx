import React from 'react';

import { iconProps } from './iconProps';

function layoutMoveToBottom(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'layout move to bottom';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6.349,6.849c.293-.293,.768-.293,1.061,0l.841,.841v-2.189c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.189l.841-.841c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.121,2.121c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2.121-2.121c-.293-.293-.293-.768,0-1.061Zm6.901,6.151H4.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default layoutMoveToBottom;
