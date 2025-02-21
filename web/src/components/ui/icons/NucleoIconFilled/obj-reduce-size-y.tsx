import React from 'react';

import { iconProps } from './iconProps';

function objReduceSizeY(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'obj reduce size y';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="10" width="14" fill={fill} rx="2.75" ry="2.75" x="2" y="4" />
        <path
          d="M8.488,2.757c.13,.154,.316,.243,.512,.243s.382-.089,.511-.242l1.316-1.559h0c.178-.211,.223-.515,.112-.774-.11-.258-.355-.425-.624-.425h-2.632c-.269,0-.514,.167-.624,.425-.11,.258-.066,.562,.113,.774l1.316,1.559Z"
          fill={secondaryfill}
        />
        <path
          d="M10.827,16.802l-1.316-1.559c-.129-.154-.316-.242-.511-.242s-.382,.089-.512,.243l-1.316,1.559c-.179,.211-.223,.515-.113,.774,.11,.258,.355,.425,.624,.425h2.632c.269,0,.514-.167,.624-.425,.11-.258,.066-.562-.112-.774h0Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default objReduceSizeY;
