import React from 'react';

import { iconProps } from './iconProps';

function reuse(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || 'reuse';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M14.862,3.358c-.389,.143-.588,.574-.445,.963,.056,.152,.083,.292,.083,.429V13.25c0,.689-.561,1.25-1.25,1.25H6.811l.72-.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2,2c-.293,.293-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.72-.72h6.439c1.517,0,2.75-1.233,2.75-2.75V4.75c0-.312-.059-.63-.175-.946-.144-.388-.574-.588-.963-.445Z"
          fill={secondaryfill}
        />
        <path
          d="M4.75,3.5h6.439l-.72,.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061L11.53,.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.72,.72H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,.312,.059,.63,.175,.946,.112,.303,.398,.491,.704,.491,.086,0,.173-.015,.259-.046,.389-.143,.588-.574,.445-.963-.056-.152-.083-.292-.083-.429V4.75c0-.689,.561-1.25,1.25-1.25Z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

export default reuse;
