import React from 'react';

import { iconProps } from './iconProps';

function I12px_caretLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px caret left';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m8.708,1.579c-.49-.262-1.081-.233-1.54.074l-4.647,3.099c-.418.279-.668.746-.668,1.248s.25.969.668,1.248l4.647,3.099c.251.167.541.252.832.252.242,0,.485-.059.708-.178.488-.261.792-.768.792-1.322V2.901c0-.554-.304-1.061-.792-1.322Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_caretLeft;
