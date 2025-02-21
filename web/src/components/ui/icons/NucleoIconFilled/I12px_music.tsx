import React from 'react';

import { iconProps } from './iconProps';

function I12px_music(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '12px music';

  return (
    <svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m11.397.428c-.383-.333-.892-.482-1.395-.411l-5,.714c-.856.123-1.502.867-1.502,1.732v7.286c0,.414.336.75.75.75s.75-.336.75-.75V3.901l5.5-.786v5.635c0,.414.336.75.75.75s.75-.336.75-.75V1.75c0-.507-.22-.989-.603-1.322Z"
          fill={fill}
          strokeWidth="0"
        />
        <circle cx="2.75" cy="9.75" fill={secondaryfill} r="2.25" strokeWidth="0" />
        <circle cx="9.75" cy="8.75" fill={secondaryfill} r="2.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default I12px_music;
