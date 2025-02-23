import React from 'react';

import { iconProps } from './iconProps';

function sparkle2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'sparkle 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.025,12.553l-1.848-.731-.73-1.848c-.227-.572-1.168-.572-1.395,0l-.73,1.848-1.848,.731c-.286,.113-.475,.39-.475,.697s.188,.584,.475,.697l1.848,.731,.73,1.848c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l.73-1.848,1.848-.731c.286-.113,.475-.39,.475-.697s-.188-.584-.475-.697Z"
          fill={secondaryfill}
        />
        <path
          d="M16.525,6.053l-3.28-1.297-1.298-3.281c-.227-.572-1.168-.572-1.395,0l-1.298,3.281-3.28,1.297c-.286,.113-.475,.39-.475,.697s.188,.584,.475,.697l3.28,1.297,1.298,3.281c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l1.298-3.281,3.28-1.297c.286-.113,.475-.39,.475-.697s-.188-.584-.475-.697Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default sparkle2;
