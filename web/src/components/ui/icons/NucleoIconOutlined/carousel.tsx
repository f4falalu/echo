import React from "react";

import { iconProps } from "./iconProps";

function carousel(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px carousel";

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
          d="M3,13.75h-.25c-.828,0-1.5-.672-1.5-1.5V5.75c0-.828,.672-1.5,1.5-1.5h.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.75h.25c.828,0,1.5-.672,1.5-1.5V5.75c0-.828-.672-1.5-1.5-1.5h-.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="12.5"
          width="7.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(180 9 9)"
          x="5.25"
          y="2.75"
        />
      </g>
    </svg>
  );
}

export default carousel;
