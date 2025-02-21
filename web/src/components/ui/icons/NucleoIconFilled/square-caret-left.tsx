import React from 'react';

import { iconProps } from './iconProps';

function squareCaretLeft(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'square caret left';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.25,9.022c0,.602-.672,.958-1.17,.621l-2.987-2.022c-.439-.298-.439-.945,0-1.242l2.987-2.022c.498-.337,1.17,.02,1.17,.621v4.044Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default squareCaretLeft;
