import React from 'react';

import { iconProps } from './iconProps';

function userStar(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '16px';
  const title = props.title || 'user star';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <circle cx="9" cy="4.5" fill={fill} r="3.5" />
        <path
          d="M9.523,16.619l.184-1.071-.778-.758c-.617-.601-.836-1.484-.57-2.305,.268-.822,.964-1.409,1.817-1.533l1.075-.156,.481-.974c.036-.074,.093-.131,.137-.199-.886-.4-1.86-.623-2.869-.623-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.171,0,.341-.014,.512-.02,.001-.121-.01-.24,.011-.361Z"
          fill={fill}
        />
        <path
          d="M17.713,12.947c-.088-.271-.323-.469-.605-.51l-1.855-.27-.83-1.681c-.252-.512-1.093-.512-1.345,0l-.83,1.681-1.855,.27c-.282,.041-.517,.239-.605,.51-.088,.271-.015,.57,.19,.769l1.343,1.309-.317,1.848c-.048,.282,.067,.566,.298,.734s.537,.189,.79,.057l1.66-.873,1.66,.873c.11,.058,.229,.086,.349,.086,.155,0,.31-.048,.441-.143,.231-.168,.347-.452,.298-.734l-.317-1.848,1.343-1.309c.205-.199,.278-.498,.19-.769Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default userStar;
