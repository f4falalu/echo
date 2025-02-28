import React from "react";

import { iconProps } from "./iconProps";

function giftCard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px gift card";

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
          d="M4.5,1.25c-.966,0-1.75,.784-1.75,1.75s.784,1.75,1.75,1.75h2.75s-.203-3.5-2.75-3.5Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10,1.25c.966,0,1.75,.784,1.75,1.75s-.784,1.75-1.75,1.75h-2.75s.203-3.5,2.75-3.5Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 4.75L7.25 14.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 8.25L16.25 8.25"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="14.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9.5)"
          x="4.25"
          y="2.25"
        />
      </g>
    </svg>
  );
}

export default giftCard;
