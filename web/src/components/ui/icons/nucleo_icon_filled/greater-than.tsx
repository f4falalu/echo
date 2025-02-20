import React from 'react';

import { iconProps } from './iconProps';

function greaterThan(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'greater than';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="m3.751,16c-.2559,0-.5049-.1309-.6455-.3662-.2119-.356-.0947-.8164.2607-1.0283l9.417-5.6055L3.3662,3.3945c-.3555-.2119-.4727-.6724-.2607-1.0283.2119-.3545.6719-.4722,1.0283-.2607l10.5,6.25c.2266.1353.3662.3804.3662.6445s-.1396.5093-.3662.6445l-10.5,6.25c-.1201.0713-.2529.1055-.3828.1055Z"
          fill={fill}
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default greaterThan;
