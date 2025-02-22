import React from 'react';

import { iconProps } from './iconProps';

function caretDownFromLine(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'caret down from line';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.75,2H3.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill={secondaryfill}
        />
        <path
          d="M13.682,5H4.318c-.638,0-1.226,.347-1.533,.906s-.287,1.242,.055,1.781l4.682,7.383c.323,.509,.875,.812,1.478,.812s1.155-.304,1.478-.812l4.682-7.383c.341-.539,.362-1.222,.055-1.781s-.895-.906-1.533-.906Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default caretDownFromLine;
