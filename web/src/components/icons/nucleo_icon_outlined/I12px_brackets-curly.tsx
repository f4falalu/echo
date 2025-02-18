import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_bracketsCurly(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px brackets curly";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m7.75,10.75c1.105,0,2-.895,2-2v-1.25c0-.828.672-1.5,1.5-1.5-.828,0-1.5-.672-1.5-1.5v-1.25c0-1.105-.895-2-2-2" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m4.25,10.75c-1.105,0-2-.895-2-2v-1.25c0-.828-.672-1.5-1.5-1.5.828,0,1.5-.672,1.5-1.5v-1.25c0-1.105.895-2,2-2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 12px_bracketsCurly;