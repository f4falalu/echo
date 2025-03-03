import React from 'react';
import { iconProps } from './iconProps';



function laptopChartPie(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px laptop chart pie";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="8.75" fill="none" r="2.5" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9,6.25v2.5h2.5c0-1.381-1.119-2.5-2.5-2.5Z" fill={secondaryfill}/>
		<path d="M4.25,14.75c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2H13.75c1.105,0,2,.895,2,2V12.75c0,1.105-.895,2-2,2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M0.75 14.75L17.25 14.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default laptopChartPie;