import React from "react";

import { iconProps } from "./iconProps";

function stackX2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px stack x 2";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <rect
          height="14"
          width="9"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="4.5"
          y="2"
        />
        <path
          d="M15.75,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M2.25,2c-.414,0-.75,.336-.75,.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default stackX2;
