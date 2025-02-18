import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_dividerYDotted(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px divider y dotted";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m10.75,1.25c0,1.105-.895,2-2,2H3.25c-1.105,0-2-.895-2-2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="m10.75,10.75c0-1.105-.895-2-2-2H3.25c-1.105,0-2,.895-2,2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="10.25" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="7.417" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="4.583" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="1.75" cy="6" fill={secondaryfill} r=".75" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_dividerYDotted;