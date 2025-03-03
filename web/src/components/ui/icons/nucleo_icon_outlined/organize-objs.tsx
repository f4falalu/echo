import React from 'react';
import { iconProps } from './iconProps';



function organizeObjs(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px organize objs";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.25 12.75L12.75 15.25 15.25 12.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M15.25 5.25L12.75 2.75 10.25 5.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.75 15L12.75 3" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="5" width="5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="10.25"/>
		<rect height="5" width="5" fill="none" rx="1" ry="1" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="2.75" y="2.75"/>
	</g>
</svg>
	);
};

export default organizeObjs;