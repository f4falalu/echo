import React from 'react';

import { iconProps } from './iconProps';

function connectedDots2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'connected dots 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M5.046,12.261c-.118,0-.237-.028-.349-.086-.367-.193-.507-.646-.314-1.013l2.907-5.523c.193-.368,.646-.506,1.013-.314,.367,.193,.507,.646,.314,1.013l-2.907,5.523c-.134,.255-.395,.401-.664,.401Z"
          fill={secondaryfill}
        />
        <path
          d="M12.954,12.261c-.27,0-.53-.146-.664-.401l-2.907-5.523c-.193-.366-.052-.82,.314-1.013,.365-.194,.819-.053,1.013,.314l2.907,5.523c.193,.366,.052,.82-.314,1.013-.111,.059-.231,.086-.349,.086Z"
          fill={secondaryfill}
        />
        <path
          d="M11.75,14H6.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill={secondaryfill}
        />
        <circle cx="9" cy="4" fill={fill} r="3" />
        <circle cx="14" cy="13.5" fill={fill} r="3" />
        <circle cx="4" cy="13.5" fill={fill} r="3" />
      </g>
    </svg>
  );
}

export default connectedDots2;
