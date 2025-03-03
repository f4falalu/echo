import React from 'react';
import { iconProps } from './iconProps';



function octagonWarning(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px octagon warning";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9 5.431L9 9.569" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,11.417c-.551,0-1,.449-1,1s.449,1,1,1,1-.449,1-1-.449-1-1-1Z" fill={secondaryfill}/>
		<path d="M10.968,2.25h-3.935c-.53,0-1.039,.211-1.414,.586l-2.782,2.782c-.375,.375-.586,.884-.586,1.414v3.935c0,.53,.211,1.039,.586,1.414l2.782,2.782c.375,.375,.884,.586,1.414,.586h3.935c.53,0,1.039-.211,1.414-.586l2.782-2.782c.375-.375,.586-.884,.586-1.414v-3.935c0-.53-.211-1.039-.586-1.414l-2.782-2.782c-.375-.375-.884-.586-1.414-.586Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default octagonWarning;