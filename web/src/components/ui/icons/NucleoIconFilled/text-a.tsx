import React from 'react';

import { iconProps } from './iconProps';

function textA(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'text a';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path d="M5.107 11H12.892V12.5H5.107z" fill={secondaryfill} />
        <path
          d="M14.25,16c-.3,0-.584-.182-.699-.479L9,3.789,4.449,15.521c-.15,.387-.586,.577-.97,.428-.386-.15-.578-.584-.428-.97L7.899,2.479c.112-.289,.39-.479,.699-.479h.803c.31,0,.587,.19,.699,.479l4.849,12.5c.15,.386-.042,.82-.428,.97-.089,.035-.181,.051-.271,.051Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default textA;
