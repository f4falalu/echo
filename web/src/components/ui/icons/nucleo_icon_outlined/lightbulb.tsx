import React from 'react';
import { iconProps } from './iconProps';



function lightbulb(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px lightbulb";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.75 13.25L11.25 13.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14,6.75c0-3.113-2.846-5.562-6.078-4.887-1.932,.403-3.475,1.993-3.834,3.933-.434,2.344,.771,4.459,2.662,5.415v3.039c0,1.105,.895,2,2,2h.5c1.105,0,2-.895,2-2v-3.039c1.63-.824,2.75-2.51,2.75-4.461Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default lightbulb;