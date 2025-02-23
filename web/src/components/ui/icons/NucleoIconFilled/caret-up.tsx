import React from 'react';

import { iconProps } from './iconProps';

function caretUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'caret up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M10.478,3.389c-.323-.509-.875-.812-1.478-.812s-1.155,.304-1.478,.812L2.497,11.313c-.341,.539-.362,1.222-.055,1.781s.895,.906,1.533,.906H14.024c.638,0,1.226-.347,1.533-.906s.287-1.242-.055-1.781L10.478,3.389Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default caretUp;
