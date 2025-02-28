import React from "react";

import { iconProps } from "./iconProps";

function battery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px battery";

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
          height="9.5"
          width="14"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="4.25"
        />
        <path
          d="M15.75 7.75H17.25V10.25H15.75z"
          fill="#212121"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default battery;
