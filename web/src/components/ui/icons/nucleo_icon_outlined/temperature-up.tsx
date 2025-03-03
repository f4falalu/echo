import React from 'react';
import { iconProps } from './iconProps';



function temperatureUp(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px temperature up";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.25 12L6.25 6" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.75,10.306V4.25c0-1.381,1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5v6.056c.617,.631,1,1.492,1,2.444,0,1.933-1.567,3.5-3.5,3.5s-3.5-1.567-3.5-3.5c0-.952,.383-1.813,1-2.444Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25 5.25L13.75 2.75 16.25 5.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.75 2.75L13.75 10.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="6.25" cy="12.75" fill={secondaryfill} r="1.5"/>
	</g>
</svg>
	);
};

export default temperatureUp;