import React from 'react';
import { iconProps } from './iconProps';



function imageMinus(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px image minus";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m3.762,14.989l6.074-6.075c.781-.781,2.047-.781,2.828,0l2.586,2.586" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m9.461,2.75h-4.711c-1.1046,0-2,.8955-2,2v8.5c0,1.1045.8954,2,2,2h8.5c1.1046,0,2-.8955,2-2v-7" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.75 3.75L11.75 3.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6.25" cy="7.25" fill={fill} r="1.25" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default imageMinus;