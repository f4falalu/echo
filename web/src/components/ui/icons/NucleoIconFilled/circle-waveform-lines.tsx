import React from 'react';

import { iconProps } from './iconProps';

function circleWaveformLines(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'circle waveform lines';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm-3,8.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5Zm2.5,1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5Zm2.5,2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.25Zm2.5-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default circleWaveformLines;
