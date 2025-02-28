import React from "react";

import { iconProps } from "./iconProps";

function toolArrow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px tool arrow";

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
          d="M1.25 10.75L7.417 4.583"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 2.917L10.75 1.25 9.083 6.25 5.75 2.917z"
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

export default toolArrow;
