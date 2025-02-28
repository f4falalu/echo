import React from "react";

import { iconProps } from "./iconProps";

function bookmarks(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px bookmarks";

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
          d="M12.25,16.25l-4.75-3.5-4.75,3.5V6.75c0-1.105,.895-2,2-2h5.5c1.105,0,2,.895,2,2v9.5Z"
          fill="none"
          stroke="#212121"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.781,2c.287-.159,.617-.25,.969-.25h5.5c1.105,0,2,.895,2,2V13.25"
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

export default bookmarks;
