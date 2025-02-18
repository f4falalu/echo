import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_viewAll2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px view all 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="7" width="7" fill={fill} rx="1.75" ry="1.75" x="3" y="2"/>
		<rect height="10" width="5.5" fill={secondaryfill} rx="1.75" ry="1.75" x="11.5" y="4"/>
		<rect height="5.5" width="9" fill={fill} rx="1.75" ry="1.75" x="1" y="10.5"/>
	</g>
</svg>
	);
};

export default 18px_viewAll2;