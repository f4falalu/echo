import React from "react";

import { iconProps } from "./iconProps";

function barsFilter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px bars filter";

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
          d="M12.75,8.25H5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M15.25,3.5H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
        <path
          d="M10,13h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="#212121"
        />
      </g>
    </svg>
  );
}

export default barsFilter;
