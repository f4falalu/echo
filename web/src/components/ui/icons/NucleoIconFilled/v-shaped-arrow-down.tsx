import React from 'react';

import { iconProps } from './iconProps';

function vShapedArrowDown(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'v shaped arrow down';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.828,6.88l-5.828,3.963L3.172,6.88c-.344-.234-.81-.144-1.042,.198-.233,.343-.145,.809,.198,1.042l6.25,4.25c.127,.086,.274,.13,.422,.13s.295-.043,.422-.13l6.25-4.25c.343-.233,.432-.699,.198-1.042-.233-.342-.7-.433-1.042-.198Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default vShapedArrowDown;
