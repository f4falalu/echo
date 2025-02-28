import React from "react";

import { iconProps } from "./iconProps";

function chevronReduceX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px chevron reduce x";

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
          d="M10.75 8.75L8 6 10.75 3.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25 8.75L4 6 1.25 3.25"
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

export default chevronReduceX;
