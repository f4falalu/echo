import React from "react";

import { iconProps } from "./iconProps";

function radioChecked(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px radio checked";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="6"
          fill="#212121"
          r="2.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default radioChecked;
