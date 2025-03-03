import React from 'react';
import { iconProps } from './iconProps';



function stackY(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px stack y";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="11.5" width="9.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(-90 9 9)" x="4.25" y="3.25"/>
		<path d="M14.25 1.25L3.75 1.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.25 16.75L3.75 16.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default stackY;