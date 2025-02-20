import React from 'react';
import { iconProps } from './iconProps';



function priorityHigh2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px priority high 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="12.5" width="2.5" fill={secondaryfill} rx="1" ry="1" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="13.25" y="2.75"/>
		<rect height="7.5" width="2.5" fill={secondaryfill} rx="1" ry="1" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="7.75" y="7.75"/>
		<rect height="3.5" width="2.5" fill={secondaryfill} rx="1" ry="1" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.25" y="11.75"/>
	</g>
</svg>
	);
};

export default priorityHigh2;