import React from 'react';
import { iconProps } from './iconProps';

function hairDryer(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || '18px hair dryer';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.285,10.271l.592,4.536c.069,.528-.289,1.018-.813,1.113l-.918,.167c-.508,.092-1.003-.217-1.142-.714l-1.336-4.772"
          fill="none"
          stroke={secondaryfill}
          strokeMiterlimit="10"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,6.75v2s-4.291,2-6.5,2S1.75,8.959,1.75,6.75c0-2.209,1.791-4,4-4s6.5,2,6.5,2c0,0,0,2,0,2Z"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25,4.75l3.3-1.444c.33-.145,.7,.098,.7,.458v5.971c0,.361-.37,.603-.7,.458l-3.3-1.444"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.75" cy="6.75" fill={secondaryfill} r="1.25" />
      </g>
    </svg>
  );
}

export default hairDryer;
