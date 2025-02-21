import React from 'react';

import { iconProps } from './iconProps';

function vibrance(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'vibrance';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.332,2.852c-.319-.533-.881-.852-1.502-.852H3.17c-.621,0-1.183,.318-1.502,.852-.319,.533-.334,1.178-.041,1.725L7.458,15.458c.305,.57,.896,.924,1.542,.924s1.237-.354,1.542-.924l5.83-10.882c.293-.547,.278-1.192-.041-1.725Zm-7.332,6.898c-1.103,0-2-.897-2-2s.897-2,2-2,2,.897,2,2-.897,2-2,2Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default vibrance;
