import React from 'react';
import { iconProps } from './iconProps';



function squareCircle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px square circle";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.458,10.25c-.123,.398-.208,.812-.208,1.25,0,2.347,1.903,4.25,4.25,4.25s4.25-1.903,4.25-4.25-1.903-4.25-4.25-4.25c-.438,0-.852,.085-1.25,.208" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="7.5" width="7.5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="2.75"/>
	</g>
</svg>
	);
};

export default squareCircle;