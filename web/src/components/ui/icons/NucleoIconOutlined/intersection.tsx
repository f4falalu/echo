import React from "react";

import { iconProps } from "./iconProps";

function intersection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px intersection";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="15.25" cy="9" fill="#212121" r=".75" />
        <circle cx="12.125" cy="9" fill="#212121" r=".75" />
        <circle cx="5.875" cy="9" fill="#212121" r=".75" />
        <circle cx="2.75" cy="9" fill="#212121" r=".75" />
        <circle cx="9" cy="2.75" fill="#212121" r=".75" />
        <circle cx="9" cy="5.875" fill="#212121" r=".75" />
        <circle cx="9" cy="9" fill="#212121" r=".75" />
        <circle cx="9" cy="12.125" fill="#212121" r=".75" />
        <circle cx="9" cy="15.25" fill="#212121" r=".75" />
        <path
          d="M1.75 5.75L5.75 5.75 5.75 1.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 1.75L12.25 5.75 16.25 5.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 12.25L12.25 12.25 12.25 16.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 16.25L5.75 12.25 1.75 12.25"
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

export default intersection;
