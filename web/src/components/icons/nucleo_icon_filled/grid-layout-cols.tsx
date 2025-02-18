import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_gridLayoutCols(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px grid layout cols";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="14" width="6" fill={secondaryfill} rx="2.25" ry="2.25" strokeWidth="0" x="10" y="2"/>
		<rect height="14" width="6" fill={fill} rx="2.25" ry="2.25" strokeWidth="0" x="2" y="2"/>
	</g>
</svg>
	);
};

export default 18px_gridLayoutCols;