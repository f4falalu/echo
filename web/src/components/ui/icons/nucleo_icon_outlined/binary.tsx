import React from 'react';
import { iconProps } from './iconProps';



function binary(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px binary";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<ellipse cx="6.75" cy="12.5" fill="none" rx="1.5" ry="2.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<ellipse cx="11.25" cy="5.5" fill="none" rx="1.5" ry="2.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.75,7.75V3.25s-.516,.907-1.609,1.116" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.75,14.75v-4.5s-.516,.907-1.609,1.116" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.25,15.75c-.552,0-1-.448-1-1v-4.75c0-.552-.448-1-1-1,.552,0,1-.448,1-1V3.25c0-.552,.448-1,1-1" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.75,15.75c.552,0,1-.448,1-1v-4.75c0-.552,.448-1,1-1-.552,0-1-.448-1-1V3.25c0-.552-.448-1-1-1" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default binary;