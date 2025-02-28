import React from "react";

import { iconProps } from "./iconProps";

function align2Left(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px align 2 left";

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
          d="M2.75 16.25L2.75 1.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="4.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-90 10.5 9)"
          x="8.25"
          y="4.25"
        />
      </g>
    </svg>
  );
}

export default align2Left;
