import React from 'react';

import { iconProps } from './iconProps';

function I12px_arrowTriangleLineLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px arrow triangle line left';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m11,6.75h-5.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h5.75c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m5.299,2.399c-.432-.21-.936-.159-1.317.136h0S.797,5.014.797,5.014c-.307.238-.482.598-.482.986s.176.748.482.986l3.186,2.479c.225.175.494.264.766.264.187,0,.375-.042.551-.128.432-.211.701-.642.701-1.123V3.522c0-.481-.269-.912-.701-1.123Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default I12px_arrowTriangleLineLeft;
