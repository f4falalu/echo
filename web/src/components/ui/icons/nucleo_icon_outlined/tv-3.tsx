import React from 'react';
import { iconProps } from './iconProps';



function tv3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px tv 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12 0.75L9 3.75 6.75 1.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="10.5" width="14.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="3.75"/>
		<rect height="6" width="7" fill={fill} rx=".5" ry=".5" strokeWidth="0" x="4" y="6"/>
		<circle cx="13" cy="7" fill={fill} r="1" strokeWidth="0"/>
		<circle cx="13" cy="10" fill={fill} r="1" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default tv3;