import React from 'react';

import { iconProps } from './iconProps';

function objIncreaseSizeX(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'obj increase size x';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <rect height="14" width="10" fill={fill} rx="2.75" ry="2.75" x="4" y="2" />
        <path
          d="M17.758,8.489l-1.559-1.316h0c-.211-.178-.515-.223-.774-.113-.258,.11-.425,.355-.425,.624v2.632c0,.269,.167,.514,.425,.624,.258,.11,.562,.066,.774-.113l1.559-1.316c.154-.13,.243-.316,.243-.512s-.089-.382-.242-.511Z"
          fill={secondaryfill}
        />
        <path
          d="M2.575,7.06c-.258-.11-.562-.066-.774,.112h0S.242,8.489,.242,8.489c-.154,.129-.242,.316-.242,.511s.089,.382,.243,.512l1.559,1.316c.211,.178,.515,.223,.774,.113,.258-.11,.425-.355,.425-.624v-2.632c0-.269-.167-.514-.425-.624Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default objIncreaseSizeX;
