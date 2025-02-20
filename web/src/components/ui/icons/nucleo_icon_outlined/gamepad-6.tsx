import React from 'react';
import { iconProps } from './iconProps';



function gamepad6(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px gamepad 6";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="14.25" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="12.75" cy="10.5" fill={secondaryfill} r=".75"/>
		<path d="M4.75 8.25L4.75 11.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25 9.75L3.25 9.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.25,5.75H4.75C2.541,5.75,.75,7.541,.75,9.75s1.791,4,4,4c1.008,0,1.917-.385,2.62-1h3.259c.703,.615,1.613,1,2.62,1,2.209,0,4-1.791,4-4s-1.791-4-4-4Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,5.75v-.75c0-.966,.784-1.75,1.75-1.75h1.75c.966,0,1.75-.784,1.75-1.75h0" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default gamepad6;