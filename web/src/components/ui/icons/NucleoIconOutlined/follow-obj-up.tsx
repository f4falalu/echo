import React from "react";

import { iconProps } from "./iconProps";

function followObjUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px follow obj up";

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
          d="M5.75 12L9 8.75 12.25 12"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.75L9 16.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="12.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-180 9 4.25)"
          x="2.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default followObjUp;
