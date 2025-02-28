import React from "react";

import { iconProps } from "./iconProps";

function namePlate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px name plate";

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
          d="M16.25,12.25V5.75c-1.105,0-2-.896-2-2H3.75c0,1.104-.895,2-2,2v6.5c1.105,0,2,.896,2,2H14.25c0-1.104,.895-2,2-2Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 7.75L12.25 7.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 10.75L12.25 10.75"
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

export default namePlate;
