import React from 'react';

import { iconProps } from './iconProps';

function circleCaretUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'circle caret up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2.022,10H6.978c-.601,0-.958-.672-.621-1.17l2.022-2.987c.297-.439,.945-.439,1.242,0l2.022,2.987c.337,.498-.02,1.17-.621,1.17Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default circleCaretUp;
