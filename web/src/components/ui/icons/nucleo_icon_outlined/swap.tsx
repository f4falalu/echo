import React from 'react';
import { iconProps } from './iconProps';



function swap(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px swap";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="11.5" cy="11.5" fill="none" r="4.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4.25 13.5L2.75 11.75 1.25 13.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.25,16.25h-1c-1.381,0-2.5-1.119-2.5-2.5v-1.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.75 4.5L15.25 6.25 16.75 4.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.75,1.75h1c1.381,0,2.5,1.119,2.5,2.5v1.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.416,4.845c-.645-1.525-2.156-2.595-3.916-2.595-2.347,0-4.25,1.903-4.25,4.25,0,1.76,1.07,3.271,2.595,3.916" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default swap;