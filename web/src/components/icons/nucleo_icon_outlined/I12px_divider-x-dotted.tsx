import React from 'react';
import { iconProps } from './iconProps';



function dividerXDotted(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px divider x dotted";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m1.25,1.25c1.105,0,2,.895,2,2v5.5c0,1.105-.895,2-2,2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m10.75,1.25c-1.105,0-2,.895-2,2v5.5c0,1.105.895,2,2,2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6" cy="1.75" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="6" cy="4.583" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="6" cy="7.417" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="6" cy="10.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default dividerXDotted;