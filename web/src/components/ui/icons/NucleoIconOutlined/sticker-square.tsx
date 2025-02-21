import React from 'react';
import { iconProps } from './iconProps';



function stickerSquare(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sticker square";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.25,15.25c.828,0,1.5-.672,1.5-1.5v-3c0-1.105,.895-2,2-2h3c.828,0,1.5-.672,1.5-1.5" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M7.515,15.25h-2.765c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2H13.25c1.105,0,2,.895,2,2v2.765c0,1.591-.632,3.117-1.757,4.243l-1.735,1.735c-1.125,1.125-2.651,1.757-4.243,1.757Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default stickerSquare;