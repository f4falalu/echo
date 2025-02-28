import React from "react";

import { iconProps } from "./iconProps";

function dial(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px dial";

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
          d="M12.712 12.712L9 9"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="5.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy=".75" fill="#212121" r=".75" />
        <circle cx="14.834" cy="3.166" fill="#212121" r=".75" />
        <circle cx="17.25" cy="9" fill="#212121" r=".75" />
        <circle cx="14.834" cy="14.834" fill="#212121" r=".75" />
        <circle cx="3.166" cy="14.834" fill="#212121" r=".75" />
        <circle cx=".75" cy="9" fill="#212121" r=".75" />
        <circle cx="3.166" cy="3.166" fill="#212121" r=".75" />
      </g>
    </svg>
  );
}

export default dial;
