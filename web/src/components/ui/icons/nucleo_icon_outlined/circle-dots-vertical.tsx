import React from 'react';
import { iconProps } from './iconProps';



function circleDotsVertical(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px circle dots vertical";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy="9" fill="none" r="7.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M8,9c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill={secondaryfill}/>
		<path d="M8,5.5c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill={secondaryfill}/>
		<path d="M8,12.5c0-.551,.449-1,1-1s1,.449,1,1-.449,1-1,1-1-.449-1-1Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default circleDotsVertical;