import React from 'react';

import { iconProps } from './iconProps';

function pinClock(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'pin clock';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.5,13c0-3.033,2.467-5.5,5.5-5.5,.173,0,.343,.01,.511,.026,.006-.086,.018-.175,.018-.259,0-3.922-3.32-6.267-6.529-6.267S1.471,3.344,1.471,7.267c0,2.792,3.252,6.915,5.189,9.125,.339,.387,.827,.609,1.34,.609s1.001-.222,1.339-.608c.058-.067,.122-.14,.182-.21-.641-.899-1.022-1.995-1.022-3.181Zm-2.25-5.5c0-.966,.784-1.75,1.75-1.75s1.75,.784,1.75,1.75-.784,1.75-1.75,1.75-1.75-.784-1.75-1.75Z"
          fill={fill}
        />
        <path
          d="M14,9c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm2.312,4.95c-.119,.29-.398,.465-.693,.465-.096,0-.191-.018-.285-.056l-1.619-.665c-.281-.116-.465-.39-.465-.694v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.247l1.154,.474c.383,.157,.566,.596,.408,.979Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default pinClock;
