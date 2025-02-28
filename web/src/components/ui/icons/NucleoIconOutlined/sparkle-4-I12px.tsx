import React from "react";

import { iconProps } from "./iconProps";

function sparkle4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px sparkle 4";

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
          d="M6 11.25L7.487 7.488 11.25 6 7.487 4.512 6 0.75 4.512 4.512 0.75 6 4.512 7.488 6 11.25z"
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

export default sparkle4;
