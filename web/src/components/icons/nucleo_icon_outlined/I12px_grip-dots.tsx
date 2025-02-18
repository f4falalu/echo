import React from 'react';
import { iconProps } from './iconProps';



function gripDots(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px grip dots";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="6" cy="8" fill={secondaryfill} r="1" strokeWidth="0"/>
		<circle cx="2" cy="8" fill={fill} r="1" strokeWidth="0"/>
		<circle cx="10" cy="8" fill={fill} r="1" strokeWidth="0"/>
		<circle cx="6" cy="4" fill={secondaryfill} r="1" strokeWidth="0"/>
		<circle cx="2" cy="4" fill={fill} r="1" strokeWidth="0"/>
		<circle cx="10" cy="4" fill={fill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default gripDots;