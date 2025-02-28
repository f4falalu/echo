import React from "react";

import { iconProps } from "./iconProps";

function cardSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px card sparkle";

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
          d="M9 5.75L9.921 8.079 12.25 9 9.921 9.921 9 12.25 8.079 9.921 5.75 9 8.079 8.079 9 5.75z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="14.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="1.75"
        />
      </g>
    </svg>
  );
}

export default cardSparkle;
