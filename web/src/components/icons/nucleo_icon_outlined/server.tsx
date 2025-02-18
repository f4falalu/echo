import React from 'react';
import { iconProps } from './iconProps';



function server(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px server";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="4.25" cy="5.25" fill={secondaryfill} r=".75"/>
		<circle cx="6.75" cy="5.25" fill={secondaryfill} r=".75"/>
		<circle cx="4.25" cy="12.75" fill={secondaryfill} r=".75"/>
		<circle cx="6.75" cy="12.75" fill={secondaryfill} r=".75"/>
		<rect height="5" width="14.5" fill="none" rx="1.5" ry="1.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="2.75"/>
		<rect height="5" width="14.5" fill="none" rx="1.5" ry="1.5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="10.25"/>
	</g>
</svg>
	);
};

export default server;