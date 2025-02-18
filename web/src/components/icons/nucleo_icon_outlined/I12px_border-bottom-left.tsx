import React from 'react';
import { iconProps } from './iconProps';



function borderBottomLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px border bottom left";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="7.583" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="4.417" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="7.583" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="4.417" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<path d="M10.75 10.75L1.25 10.75 1.25 1.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default borderBottomLeft;