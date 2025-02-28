import React from "react";

import { iconProps } from "./iconProps";

function greekTemple(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px greek temple";

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
          d="M2.75 15.25L15.25 15.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,7.25h5.25c.552,0,1-.448,1-1v-.414c0-.362-.196-.696-.511-.873l-5.25-2.94c-.304-.17-.674-.17-.977,0L3.261,4.964c-.316,.177-.511,.511-.511,.873v.414c0,.552,.448,1,1,1h5.25Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 15.25L7.25 9.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 15.25L3.75 9.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 15.25L10.75 9.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 15.25L14.25 9.75"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy="4.75" fill="#212121" r="1" />
      </g>
    </svg>
  );
}

export default greekTemple;
