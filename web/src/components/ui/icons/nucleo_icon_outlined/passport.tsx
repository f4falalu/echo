import React from 'react';
import { iconProps } from './iconProps';



function passport(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px passport";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="7.5" fill="none" r="1.75" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="14.5" width="11.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="3.25" y="1.75"/>
		<path d="M7 12.25L11 12.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default passport;