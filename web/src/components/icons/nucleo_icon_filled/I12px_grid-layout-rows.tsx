import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_gridLayoutRows(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px grid layout rows";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="5" width="11" fill={secondaryfill} rx="1.75" ry="1.75" strokeWidth="0" x=".5" y="6.5"/>
		<rect height="5" width="11" fill={fill} rx="1.75" ry="1.75" strokeWidth="0" x=".5" y=".5"/>
	</g>
</svg>
	);
};

export default 12px_gridLayoutRows;