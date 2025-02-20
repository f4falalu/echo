import React from 'react';

import { iconProps } from './iconProps';

function squareGrid3(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'square grid 3';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75v8.5c0,1.517,1.233,2.75,2.75,2.75h8.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-6.75,11.1c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm3.5,7c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm3.5,7c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Zm0-3.5c0,.221-.179.4-.4.4h-1.2c-.221,0-.4-.179-.4-.4v-1.2c0-.221.179-.4.4-.4h1.2c.221,0,.4.179.4.4v1.2Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default squareGrid3;
