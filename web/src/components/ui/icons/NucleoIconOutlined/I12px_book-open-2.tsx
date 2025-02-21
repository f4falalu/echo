import React from 'react';
import { iconProps } from './iconProps';



function I12px_bookOpen2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px book open 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m6,11.25l4.525-1.293c.429-.123.725-.515.725-.962V2.076c0-.664-.636-1.144-1.275-.962l-3.975,1.136" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m2.025,1.114l3.975,1.136v9l-4.525-1.293c-.429-.123-.725-.515-.725-.962V2.076c0-.664.636-1.144,1.275-.962Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_bookOpen2;