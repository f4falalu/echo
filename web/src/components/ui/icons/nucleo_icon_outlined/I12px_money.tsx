import React from 'react';
import { iconProps } from './iconProps';



function I12px_money(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px money";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="8.5" width="10.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x=".75" y="1.75"/>
		<circle cx="6" cy="6" fill={secondaryfill} r="1.25" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m.75,3.75v1c1.657,0,3-1.343,3-3h-1C1.645,1.75.75,2.645.75,3.75Z" fill={fill} strokeWidth="0"/>
		<path d="m11.25,3.75v1c-1.657,0-3-1.343-3-3h1c1.105,0,2,.895,2,2Z" fill={fill} strokeWidth="0"/>
		<path d="m.75,8.25v-1c1.657,0,3,1.343,3,3h-1c-1.105,0-2-.895-2-2Z" fill={fill} strokeWidth="0"/>
		<path d="m11.25,8.25v-1c-1.657,0-3,1.343-3,3h1c1.105,0,2-.895,2-2Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default I12px_money;