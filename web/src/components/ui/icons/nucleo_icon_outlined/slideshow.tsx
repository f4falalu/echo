import React from 'react';
import { iconProps } from './iconProps';



function slideshow(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px slideshow";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="5" cy="16" fill={secondaryfill} r="1"/>
		<circle cx="13" cy="16" fill={secondaryfill} r="1"/>
		<circle cx="9" cy="16" fill={secondaryfill} r="1.25"/>
		<rect height="10" width="14.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="2.75"/>
	</g>
</svg>
	);
};

export default slideshow;