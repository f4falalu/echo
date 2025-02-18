import React from 'react';

import { iconProps } from './iconProps';

function sortUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'sort up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9.932,1.916c-.475-.529-1.389-.529-1.863,0h0s-3.131,3.5-3.131,3.5c-.334,.373-.414,.887-.211,1.344,.204,.457,.642,.741,1.142,.741h6.264c.5,0,.938-.284,1.142-.741,.203-.457,.123-.971-.211-1.343l-3.131-3.5Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default sortUp;
