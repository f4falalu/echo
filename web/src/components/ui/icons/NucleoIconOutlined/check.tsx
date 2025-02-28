import React from "react";

import { iconProps } from "./iconProps";

function check(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px check";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <path
          d="M2.75 9.25L6.75 14.25 15.25 3.75"
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

export default check;
