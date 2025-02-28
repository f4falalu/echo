import React from "react";

import { iconProps } from "./iconProps";

function sitemap3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px sitemap 3";

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
          d="m7.75,5h-1v-1.25c0-.414-.336-.75-.75-.75s-.75.336-.75.75v1.25h-1c-1.241,0-2.25,1.009-2.25,2.25v1c0,.414.336.75.75.75s.75-.336.75-.75v-1c0-.414.336-.75.75-.75h3.5c.414,0,.75.336.75.75v1c0,.414.336.75.75.75s.75-.336.75-.75v-1c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="#212121"
          strokeWidth="0"
        />
        <circle cx="2.75" cy="10" fill="#212121" r="2" strokeWidth="0" />
        <circle cx="6" cy="2" fill="#212121" r="2" strokeWidth="0" />
        <circle cx="9.25" cy="10" fill="#212121" r="2" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default sitemap3;
