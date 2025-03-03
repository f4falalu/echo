import React from 'react';
import { iconProps } from './iconProps';



function deleteRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px delete right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M4.75,14.25h7.773c.302,0,.587-.136,.777-.371l3.95-4.879-3.95-4.879c-.19-.235-.475-.371-.777-.371H4.75c-1.105,0-2,.895-2,2v6.5c0,1.105,.895,2,2,2Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25 11.25L6.75 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M6.75 11.25L11.25 6.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default deleteRight;