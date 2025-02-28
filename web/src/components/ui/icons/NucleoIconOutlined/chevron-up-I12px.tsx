import React from "react";

import { iconProps } from "./iconProps";

function chevronUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px chevron up";

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
          d="M10.25 7.75L6 3.5 1.75 7.75"
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

export default chevronUp;
