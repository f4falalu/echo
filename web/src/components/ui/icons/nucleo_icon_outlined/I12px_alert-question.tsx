import React from 'react';
import { iconProps } from './iconProps';



function I12px_alertQuestion(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px alert question";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="6" cy="10.5" fill={secondaryfill} r="1" strokeWidth="0"/>
		<path d="m3.929,3.277c.316-1.206,1.3-1.83,2.401-1.773,1.087.056,2.099.654,2.052,2.041-.066,1.972-2.277,1.612-2.382,3.955" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_alertQuestion;