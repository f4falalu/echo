import React from "react";

import { iconProps } from "./iconProps";

function caretUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px caret up";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <path
          d="m6.624,2.936l3.099,4.648c.332.498-.025,1.166-.624,1.166H2.901c-.599,0-.956-.668-.624-1.166l3.099-4.648c.297-.445.951-.445,1.248,0Z"
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

export default caretUp;
