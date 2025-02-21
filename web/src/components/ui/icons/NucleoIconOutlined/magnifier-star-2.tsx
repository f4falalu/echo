import React from 'react';
import { iconProps } from './iconProps';



function magnifierStar2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px magnifier star 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M15.25 15.5L11.285 11.535" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.473,7.103c-.044-.136-.161-.235-.303-.255l-1.439-.209-.645-1.305c-.125-.256-.547-.256-.672,0l-.645,1.305-1.439,.209c-.142,.021-.259,.12-.303,.255s-.008,.285,.095,.384l1.042,1.016-.245,1.434c-.024,.141,.033,.283,.148,.367,.115,.084,.269,.095,.396,.029l1.287-.677,1.287,.677c.055,.029,.115,.043,.175,.043,.078,0,.155-.024,.221-.072,.115-.084,.173-.226,.148-.367l-.245-1.434,1.042-1.016c.103-.1,.139-.249,.095-.384Z" fill={secondaryfill}/>
		<circle cx="7.75" cy="8" fill="none" r="5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default magnifierStar2;