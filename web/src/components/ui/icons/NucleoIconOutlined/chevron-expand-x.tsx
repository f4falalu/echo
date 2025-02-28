import React from "react";

import { iconProps } from "./iconProps";

function chevronExpandX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px chevron expand x";

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
          d="M11.75 12.5L15.25 9 11.75 5.5"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 12.5L2.75 9 6.25 5.5"
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

export default chevronExpandX;
