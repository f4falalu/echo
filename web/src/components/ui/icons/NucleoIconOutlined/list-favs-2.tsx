import React from 'react';
import { iconProps } from './iconProps';

function listFavs2(props: iconProps) {
  const fill = props.fill || 'currentColor';
  const secondaryfill = props.secondaryfill || fill;
  const strokewidth = props.strokewidth || 1;
  const width = props.width || '1em';
  const height = props.height || '15px';
  const title = props.title || '18px list favs 2';

  return (
    <svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill={fill}>
        <path
          d="M8.25 9L15.75 9"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 3.75L15.75 3.75"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.25 14.25L15.75 14.25"
          fill="none"
          stroke={fill}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.804,7.93l-1.187-.172-.531-1.076c-.125-.256-.547-.256-.672,0l-.531,1.076-1.187,.172c-.142,.021-.259,.12-.303,.255s-.008,.285,.095,.384l.858,.837-.202,1.182c-.024,.141,.033,.283,.148,.367,.115,.084,.269,.096,.396,.029l1.062-.558,1.062,.558c.056,.029,.115,.043,.175,.043,.078,0,.155-.024,.221-.072,.115-.084,.173-.226,.148-.367l-.202-1.182,.858-.837c.103-.1,.139-.249,.095-.384s-.161-.235-.303-.255Z"
          fill={secondaryfill}
        />
        <path
          d="M2.347,4.157l-.202,1.182c-.024,.141,.033,.283,.148,.367s.269,.096,.396,.029l1.062-.558,1.062,.558c.056,.029,.115,.043,.175,.043,.078,0,.155-.024,.221-.072,.115-.084,.173-.226,.148-.367l-.202-1.182,.858-.837c.103-.1,.139-.249,.095-.384s-.161-.235-.303-.255l-1.187-.172-.531-1.076c-.125-.256-.547-.256-.672,0l-.531,1.076-1.187,.172c-.142,.021-.259,.12-.303,.255s-.008,.285,.095,.384l.858,.837Z"
          fill={secondaryfill}
        />
        <path
          d="M5.804,13.18l-1.187-.172-.531-1.076c-.125-.256-.547-.256-.672,0l-.531,1.076-1.187,.172c-.142,.021-.259,.12-.303,.255s-.008,.285,.095,.384l.858,.837-.202,1.182c-.024,.141,.033,.283,.148,.367,.115,.084,.269,.095,.396,.029l1.062-.558,1.062,.558c.056,.029,.115,.043,.175,.043,.078,0,.155-.024,.221-.072,.115-.084,.173-.226,.148-.367l-.202-1.182,.858-.837c.103-.1,.139-.249,.095-.384s-.161-.235-.303-.255Z"
          fill={secondaryfill}
        />
      </g>
    </svg>
  );
}

export default listFavs2;
