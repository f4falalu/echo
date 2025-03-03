import React from 'react';
import { iconProps } from './iconProps';



function path(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px path";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="4" width="4" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="11.25" y="10.75"/>
		<path d="M5.25,3.25h7.625c1.312,0,2.375,1.063,2.375,2.375h0c0,1.312-1.063,2.375-2.375,2.375H5.125c-1.312,0-2.375,1.063-2.375,2.375h0c0,1.312,1.063,2.375,2.375,2.375h3.625" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default path;