import React from 'react';

import { iconProps } from './iconProps';

function trainer(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'trainer';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="3.25" fill={secondaryfill} r="2.75" />
        <path
          d="M15.086,10.226l-2.195-2.352c-.518-.555-1.25-.874-2.01-.874h-3.762c-.76,0-1.493,.318-2.01,.874l-2.195,2.352c-.329,.352-.495,.811-.468,1.292,.027,.48,.243,.917,.608,1.231l2.696,2.311v1.191c0,.414,.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75v-1.191l2.696-2.311c.365-.313,.581-.75,.608-1.231,.027-.481-.139-.939-.468-1.292Zm-9.336,2.858l-1.72-1.474c-.07-.061-.084-.136-.087-.176-.002-.04,.003-.117,.067-.185l1.74-1.864v3.698Zm4.75-1.583h-1.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm3.47,.109l-1.72,1.474v-3.698l1.74,1.864c.063,.068,.069,.145,.067,.185-.002,.04-.017,.115-.087,.176Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default trainer;
