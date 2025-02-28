import React from "react";

import { iconProps } from "./iconProps";

function circleDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || "12px circle dotted";

  return (
    <svg
      height="12"
      width="12"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <g fill="#212121">
        <circle cx="6" cy=".75" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="1.453" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="3.375" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx=".75" cy="6" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="1.453" cy="8.625" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="3.375" cy="10.547" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="6" cy="11.25" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="8.625" cy="10.547" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="10.547" cy="8.625" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="11.25" cy="6" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="10.547" cy="3.375" fill="#212121" r=".75" strokeWidth="0" />
        <circle cx="8.625" cy="1.453" fill="#212121" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default circleDotted;
