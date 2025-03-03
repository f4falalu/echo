import React from 'react';

import { iconProps } from './iconProps';

function seedling(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'seedling';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m9,16c-.414,0-.75-.336-.75-.75v-5.25c0-.414.336-.75.75-.75s.75.336.75.75v5.25c0,.414-.336.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
        <path
          d="m5,2h-2.25c-.414,0-.75.336-.75.75v.5c0,3.17,2.58,5.75,5.75,5.75h1.25c.414,0,.75-.336.75-.75v-1.5c0-2.619-2.131-4.75-4.75-4.75Z"
          fill={fill}
          strokeWidth="0"
        />
        <path
          d="m9,11c-.4141,0-.75-.3359-.75-.75v-1.5c0-2.6191,2.1309-4.75,4.75-4.75h2.25c.4141,0,.75.3359.75.75v.5c0,2.3872-1.502,4.5527-3.7383,5.3877-.3887.145-.8203-.0518-.9648-.4404-.1455-.3877.0518-.8198.4395-.9648,1.5752-.5879,2.6572-2.0679,2.7559-3.7324h-1.4922c-1.792,0-3.25,1.458-3.25,3.25v1.5c0,.4141-.3359.75-.75.75Z"
          fill={secondaryfill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default seedling;
