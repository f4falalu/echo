import React from "react";

import { iconProps } from "./iconProps";

function conversion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px conversion";

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
          d="M11 7.75L1 7.75 4.25 11"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1 4.25L11 4.25 7.75 1"
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

export default conversion;
