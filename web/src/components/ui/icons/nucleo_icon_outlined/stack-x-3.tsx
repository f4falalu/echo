import React from 'react';
import { iconProps } from './iconProps';



function stackX3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px stack x 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="7.5" width="12.5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(90 9 9)" x="2.75" y="5.25"/>
		<path d="M15.75 4.25L15.75 13.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.25 4.25L2.25 13.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default stackX3;