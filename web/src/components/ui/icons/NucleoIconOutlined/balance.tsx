import React from "react";

import { iconProps } from "./iconProps";

function balance(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px balance";

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
          d="M9,16.25c2.002,0,3.625-1.623,3.625-3.625s-1.623-3.625-3.625-3.625-3.625-1.623-3.625-3.625,1.623-3.625,3.625-3.625"
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
          r="7.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default balance;
