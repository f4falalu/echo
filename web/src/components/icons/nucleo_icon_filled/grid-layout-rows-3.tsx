import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_gridLayoutRows3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px grid layout rows 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="4" width="14" fill={secondaryfill} rx="1.75" ry="1.75" x="2" y="7"/>
		<rect height="4" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="1.5"/>
		<rect height="4" width="14" fill={fill} rx="1.75" ry="1.75" x="2" y="12.5"/>
	</g>
</svg>
	);
};

export default 18px_gridLayoutRows3;