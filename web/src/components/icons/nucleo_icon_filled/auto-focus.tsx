import React from 'react';

import { iconProps } from './iconProps';

function autoFocus(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1em';
  const title = props.title || 'auto focus';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="9" fill={secondaryfill} r="4" />
        <path
          d="M3.97,5.03c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.75-1.75c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.75,1.75Z"
          fill={fill}
        />
        <path
          d="M13.5,5.25c.192,0,.384-.073,.53-.22l1.75-1.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.75,1.75c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22Z"
          fill={fill}
        />
        <path
          d="M14.03,12.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.75,1.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.75-1.75Z"
          fill={fill}
        />
        <path
          d="M3.97,12.97l-1.75,1.75c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.75-1.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default autoFocus;
