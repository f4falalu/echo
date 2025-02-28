import React from "react";

import { iconProps } from "./iconProps";

function conferenceRoom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "18px conference room";

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
          height="15"
          width="8"
          fill="#212121"
          rx="1.75"
          ry="1.75"
          x="5"
          y="1.5"
        />
        <circle cx="2.25" cy="9" fill="#212121" r="1.25" />
        <circle cx="2.25" cy="4.25" fill="#212121" r="1.25" />
        <circle cx="2.25" cy="13.75" fill="#212121" r="1.25" />
        <circle cx="15.75" cy="9" fill="#212121" r="1.25" />
        <circle cx="15.75" cy="4.25" fill="#212121" r="1.25" />
        <circle cx="15.75" cy="13.75" fill="#212121" r="1.25" />
      </g>
    </svg>
  );
}

export default conferenceRoom;
