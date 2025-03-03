import React from 'react';
import { iconProps } from './iconProps';



function sidebarLeft3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sidebar left 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,2.75h5.25c1.105,0,2,.895,2,2V13.25c0,1.105-.895,2-2,2h-5.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25,15.25H3.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h2.5V15.25Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default sidebarLeft3;