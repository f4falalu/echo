import React from "react";

import { iconProps } from "./iconProps";

function gripDotsVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px grip dots vertical";

  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="6.75" cy="9" fill="#212121" r="1.25" />
        <circle cx="6.75" cy="3.75" fill="#212121" r="1.25" />
        <circle cx="6.75" cy="14.25" fill="#212121" r="1.25" />
        <circle cx="11.25" cy="9" fill="#212121" r="1.25" />
        <circle cx="11.25" cy="3.75" fill="#212121" r="1.25" />
        <circle cx="11.25" cy="14.25" fill="#212121" r="1.25" />
      </g>
    </svg>
  );
}

export default gripDotsVertical;
