import React from "react";

import { iconProps } from "./iconProps";

function alertWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px alert warning";

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
          d="M6 1.25L6 7.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="10.5" fill="#212121" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default alertWarning;
