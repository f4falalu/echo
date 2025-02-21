import React from 'react';
import { iconProps } from './iconProps';



function squareDots(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px square dots";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="12.5" width="12.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="2.75"/>
		<path d="M9,8c.551,0,1,.449,1,1s-.449,1-1,1-1-.449-1-1,.449-1,1-1Z" fill={secondaryfill}/>
		<path d="M12.5,8c.551,0,1,.449,1,1s-.449,1-1,1-1-.449-1-1,.449-1,1-1Z" fill={secondaryfill}/>
		<path d="M5.5,8c.551,0,1,.449,1,1s-.449,1-1,1-1-.449-1-1,.449-1,1-1Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default squareDots;