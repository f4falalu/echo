import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_hexadecagon(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px hexadecagon";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m11.177,5.86l-1.427-1.418v-1.995c0-.109-.088-.197-.197-.197h-1.995l-1.418-1.427c-.077-.078-.203-.078-.28,0l-1.418,1.427h-1.995c-.109,0-.197.088-.197.197v1.995l-1.427,1.418c-.078.077-.078.203,0,.28l1.427,1.418v1.995c0,.109.088.197.197.197h1.995l1.418,1.427c.077.078.203.078.28,0l1.418-1.427h1.995c.109,0,.197-.088.197-.197v-1.995l1.427-1.418c.078-.077.078-.203,0-.28Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 12px_hexadecagon;