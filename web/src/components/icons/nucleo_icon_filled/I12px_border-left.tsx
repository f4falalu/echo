import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_borderLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px border left";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="10.75" cy="7.583" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="4.417" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="4.417" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="7.583" cy="1.25" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="4.417" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="7.583" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<circle cx="10.75" cy="10.75" fill={secondaryfill} r=".75" strokeWidth="0"/>
		<path d="m1.25,11.5c-.414,0-.75-.336-.75-.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v9.5c0,.414-.336.75-.75.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_borderLeft;