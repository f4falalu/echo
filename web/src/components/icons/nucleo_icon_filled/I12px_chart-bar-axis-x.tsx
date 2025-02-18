import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function chartBarAxisX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px chart bar axis x";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m11.25,11H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h10.5c.414,0,.75.336.75.75s-.336.75-.75.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m2.75,8.5c-.414,0-.75-.336-.75-.75v-3.5c0-.414.336-.75.75-.75s.75.336.75.75v3.5c0,.414-.336.75-.75.75Z" fill={fill} strokeWidth="0"/>
		<path d="m9.25,8.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414.336-.75.75-.75s.75.336.75.75v1.5c0,.414-.336.75-.75.75Z" fill={fill} strokeWidth="0"/>
		<path d="m6,8.5c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75s.75.336.75.75v6c0,.414-.336.75-.75.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default chartBarAxisX;