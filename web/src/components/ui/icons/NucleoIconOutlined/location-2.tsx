import React from "react";

import { iconProps } from "./iconProps";

function location2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px location 2";

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
          cy="5"
          fill="none"
          r="3.25"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 13.25L9 8.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,12.429c2.507,.315,4.25,1.012,4.25,1.821,0,1.105-3.246,2-7.25,2s-7.25-.895-7.25-2c0-.809,1.743-1.507,4.25-1.821"
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

export default location2;
