import React from "react";

import { iconProps } from "./iconProps";

function gridSystem2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px grid system 2";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <rect
          height="2.5"
          width="5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="7.75"
        />
        <rect
          height="2.5"
          width="5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="10.25"
          y="7.75"
        />
        <rect
          height="2.5"
          width="12.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="12.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.75"
          y="2.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="2.75"
          y="2.75"
        />
        <rect
          height="2.5"
          width="2.5"
          fill="none"
          rx=".75"
          ry=".75"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="12.75"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default gridSystem2;
