import React from "react";

import { iconProps } from "./iconProps";

function caretMaximizeDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px caret maximize diagonal";

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
          d="M8.646,14.25H4c-.138,0-.25-.112-.25-.25v-4.646c0-.223,.269-.334,.427-.177l4.646,4.646c.157,.157,.046,.427-.177,.427Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.354,3.75h4.646c.138,0,.25,.112,.25,.25v4.646c0,.223-.269,.334-.427,.177l-4.646-4.646c-.157-.157-.046-.427,.177-.427Z"
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

export default caretMaximizeDiagonal;
