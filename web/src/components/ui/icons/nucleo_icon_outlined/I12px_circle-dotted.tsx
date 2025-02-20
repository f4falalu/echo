import React from 'react';
import { iconProps } from './iconProps';



function I12px_circleDotted(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px circle dotted";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="6" cy=".75" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx="3.375" cy="1.453" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="1.453" cy="3.375" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx=".75" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="1.453" cy="8.625" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx="3.375" cy="10.547" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="6" cy="11.25" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx="8.625" cy="10.547" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.547" cy="8.625" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx="11.25" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.547" cy="3.375" fill={fill} r=".75" strokeWidth="0"/>
		<circle cx="8.625" cy="1.453" fill={secondaryfill} r=".75" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_circleDotted;