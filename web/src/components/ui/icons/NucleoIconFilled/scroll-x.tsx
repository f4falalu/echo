import React from "react";

import { iconProps } from "./iconProps";

function scrollX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px scroll x";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="9" cy="9" fill="#212121" r="3" />
        <path
          d="M4.78,5.72c-.293-.293-.768-.293-1.061,0L.97,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.22-2.22,2.22-2.22c.293-.293,.293-.768,0-1.061Z"
          fill="#212121"
        />
        <path
          d="M14.28,5.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.22,2.22-2.22,2.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061l-2.75-2.75Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default scrollX;
