import React from 'react';
import { iconProps } from './iconProps';



function windowChartLine(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px window chart line";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M4.75 12L6.5 10 7.5 11.25 9.5 7.75 11 10.25 13.25 5.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="12.5" width="14.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(180 9 9)" x="1.75" y="2.75"/>
		<circle cx="4.25" cy="5.25" fill={fill} r=".75"/>
		<circle cx="6.75" cy="5.25" fill={fill} r=".75"/>
	</g>
</svg>
	);
};

export default windowChartLine;