import React from 'react';

import { iconProps } from './iconProps';

function person(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'person';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="2.5" fill={secondaryfill} r="2.5" />
        <path
          d="M12.146,7.346c-.201-.638-.737-1.1-1.4-1.206-1.152-.182-2.341-.182-3.488,0-.664,.104-1.2,.562-1.4,1.195l-1.169,3.703c-.103,.324-.071,.667,.089,.964,.161,.299,.43,.515,.758,.609l.742,.212,.176,3.513c.046,.933,.814,1.663,1.748,1.663h1.598c.934,0,1.701-.73,1.748-1.663l.176-3.514,.739-.211c.328-.093,.597-.31,.758-.61,.162-.3,.194-.644,.091-.969l-1.164-3.688Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default person;
