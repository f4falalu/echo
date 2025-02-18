import React from 'react';
import { iconProps } from './iconProps';



function pinTack(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px pin tack";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 8.25L6 11.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m6,8.25h4.25c-.2-1.211-.704-2.208-1.5-3v-2.5c0-1.105-.895-2-2-2h-.75s-.75,0-.75,0c-1.105,0-2,.895-2,2v2.5c-.796.792-1.3,1.789-1.5,3h4.25Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default pinTack;