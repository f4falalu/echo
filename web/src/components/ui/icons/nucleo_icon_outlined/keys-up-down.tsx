import React from 'react';
import { iconProps } from './iconProps';



function keysUpDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px keys up down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="7.5" width="7" fill="none" rx="1.5" ry="1.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(90 9 4.25)" x="5.5" y=".5"/>
		<rect height="7.5" width="7" fill="none" rx="1.5" ry="1.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(90 9 13.75)" x="5.5" y="10"/>
		<path d="M16.75,12.75c-.828,0-1.5-.672-1.5-1.5V6.75c0-.828,.672-1.5,1.5-1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.25,12.75c.828,0,1.5-.672,1.5-1.5V6.75c0-.828-.672-1.5-1.5-1.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.25 4.5L9 3.25 7.75 4.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.25 13.5L9 14.75 7.75 13.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default keysUpDown;