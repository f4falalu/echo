import React from "react";

import { iconProps } from "./iconProps";

function link4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px link 4";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <path
          d="m9.25,7.5v.5c0,1.795-1.455,3.25-3.25,3.25h0c-1.795,0-3.25-1.455-3.25-3.25v-.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.25,4.5v-.5c0-1.795-1.455-3.25-3.25-3.25h0c-1.795,0-3.25,1.455-3.25,3.25v.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 8.25L6 3.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default link4;
