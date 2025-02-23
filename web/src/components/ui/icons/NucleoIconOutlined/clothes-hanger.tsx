import React from 'react';
import { iconProps } from './iconProps';

function clothesHanger(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '1rem';
  const title = props.title || '18px clothes hanger';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M11.014,10.5l4.51,3.266c.427,.309,.208,.984-.319,.984H2.795c-.527,0-.746-.675-.319-.984l6.524-4.724v-1.792c1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25-2.25,1.007-2.25,2.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default clothesHanger;
