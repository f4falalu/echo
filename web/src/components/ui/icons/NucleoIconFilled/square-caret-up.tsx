import React from 'react';

import { iconProps } from './iconProps';

function squareCaretUp(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || 'square caret up';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.228,9H6.978c-.601,0-.958-.672-.621-1.17l2.022-2.987c.297-.439,.945-.439,1.242,0l2.022,2.987c.337,.498-.02,1.17-.621,1.17Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareCaretUp;
