import React from 'react';
import { iconProps } from './iconProps';



function inbox(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px inbox";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.213,9.75c-.023-.12-.057-.238-.102-.353l-2.113-5.379c-.301-.765-1.039-1.269-1.862-1.269H5.863c-.822,0-1.561,.503-1.862,1.269L1.888,9.397c-.045,.114-.079,.232-.102,.353" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.75,9.75v1c0,.552-.448,1-1,1h-3.5c-.552,0-1-.448-1-1v-1H1.787c-.024,.125-.037,.251-.037,.379v3.121c0,1.104,.895,2,2,2H14.25c1.105,0,2-.896,2-2v-3.121c0-.127-.013-.254-.037-.379h-4.463Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default inbox;