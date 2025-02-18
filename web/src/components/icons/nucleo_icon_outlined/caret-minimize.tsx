import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_caretMinimize(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px caret minimize";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.25,3.604v3.396c0,.138-.112,.25-.25,.25H3.604c-.223,0-.334-.269-.177-.427l3.396-3.396c.157-.157,.427-.046,.427,.177Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.396,7.25h-3.396c-.138,0-.25-.112-.25-.25V3.604c0-.223,.269-.334,.427-.177l3.396,3.396c.157,.157,.046,.427-.177,.427Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.75,14.396v-3.396c0-.138,.112-.25,.25-.25h3.396c.223,0,.334,.269,.177,.427l-3.396,3.396c-.157,.157-.427,.046-.427-.177Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M3.604,10.75h3.396c.138,0,.25,.112,.25,.25v3.396c0,.223-.269,.334-.427,.177l-3.396-3.396c-.157-.157-.046-.427,.177-.427Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_caretMinimize;