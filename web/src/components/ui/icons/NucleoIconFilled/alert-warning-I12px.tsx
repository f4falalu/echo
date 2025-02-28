import React from "react";

import { iconProps } from "./iconProps";

function alertWarning(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px alert warning";

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
          d="M9,11.5c.414,0,.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.75c0,.414,.336,.75,.75,.75Z"
          fill="#212121"
        />
        <circle cx="9" cy="15" fill="#212121" r="1" />
      </g>
    </svg>
  );
}

export default alertWarning;
