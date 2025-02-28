import React from "react";

import { iconProps } from "./iconProps";

function stackX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px stack x";

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
          height="13"
          width="11"
          fill="#212121"
          rx="2.75"
          ry="2.75"
          x="3.5"
          y="2.5"
        />
        <path
          d="M1.25,3c-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M16.75,3c-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default stackX;
