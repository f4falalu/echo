import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function rectLayoutGrid3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px rect layout grid 3";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m11.5,4v-.75c0-1.517-1.233-2.75-2.75-2.75H3.25C1.733.5.5,1.733.5,3.25v.75h11Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m5.5,5.5v6h3.25c1.517,0,2.75-1.233,2.75-2.75v-3.25h-6Z" fill={fill} strokeWidth="0"/>
		<path d="m4,5.5H.5v3.25c0,1.517,1.233,2.75,2.75,2.75h.75v-6Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default rectLayoutGrid3;