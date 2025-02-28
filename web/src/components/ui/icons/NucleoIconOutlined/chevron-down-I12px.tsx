import React from "react";

import { iconProps } from "./iconProps";

function chevronDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px chevron down";

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
          d="M1.75 4.25L6 8.5 10.25 4.25"
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

export default chevronDown;
