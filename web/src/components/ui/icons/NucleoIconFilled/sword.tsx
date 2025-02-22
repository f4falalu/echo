import React from 'react';

import { iconProps } from './iconProps';

function sword(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'sword';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M16.53,1.47c-.177-.177-.432-.255-.677-.205l-4.608,.922c-.442,.088-.829,.34-1.088,.708l-3.131,4.449,3.63,3.63,4.449-3.131c.369-.259,.62-.646,.708-1.088l.922-4.608c.049-.246-.028-.5-.205-.677Z"
          fill={secondaryfill}
        />
        <path
          d="M10.28,12.72L5.28,7.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97-2.439,2.439-.22-.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l3.5,3.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.22-.22,2.439-2.439,.97,.97c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default sword;
