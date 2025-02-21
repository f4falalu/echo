import React from 'react';
import { iconProps } from './iconProps';



function I12px_caretExpandX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px caret expand x";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m.865,5.8l2.985-2.249c.165-.124.4-.007.4.2v4.497c0,.206-.236.324-.4.2L.865,6.2c-.133-.1-.133-.299,0-.399Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m11.135,5.8l-2.985-2.249c-.165-.124-.4-.007-.4.2v4.497c0,.206.236.324.4.2l2.985-2.249c.133-.1.133-.299,0-.399Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default I12px_caretExpandX;