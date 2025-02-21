import React from 'react';

import { iconProps } from './iconProps';

function bagOutForDelivery(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'bag out for delivery';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.406,6.512c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.129,1.488H7.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.334l-.13,1.5h3.546c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.073l-.131,1.512c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892H14.318c.769,0,1.508-.325,2.027-.892s.779-1.331,.712-2.097l-.652-7.5Zm-4.906-2.512h-3v-1c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1Z"
          fill={fill}
        />
        <path
          d="M3.465,8H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.584l.13-1.5Z"
          fill={secondaryfill}
        />
        <path
          d="M3.204,11H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H3.073l.13-1.5Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default bagOutForDelivery;
