import React from "react";

import { iconProps } from "./iconProps";

function wifi(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px wifi";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle
          cx="9"
          cy="13.25"
          fill="none"
          r="1.5"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.111,9.361c2.148-2.148,5.63-2.148,7.778,0"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.282,6.532c3.71-3.71,9.725-3.71,13.435,0"
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

export default wifi;
