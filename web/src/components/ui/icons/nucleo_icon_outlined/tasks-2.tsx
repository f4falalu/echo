import React from 'react';
import { iconProps } from './iconProps';



function tasks2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px tasks 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.247 11.5L9.856 13 13.253 8.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2.801,11.998L1.772,5.074c-.162-1.093,.592-2.11,1.684-2.272l6.924-1.029c.933-.139,1.81,.39,2.148,1.228" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="11" width="11" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="5.25" y="5.25"/>
	</g>
</svg>
	);
};

export default tasks2;