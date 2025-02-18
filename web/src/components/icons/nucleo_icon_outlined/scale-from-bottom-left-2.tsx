import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_scaleFromBottomLeft2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px scale from bottom left 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.75,15.25h2.5c1.105,0,2-.895,2-2V4.75c0-1.105-.895-2-2-2H4.75c-1.105,0-2,.895-2,2v2.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="6" width="6" fill="none" rx="2" ry="2" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} transform="rotate(-90 5.75 12.25)" x="2.75" y="9.25"/>
	</g>
</svg>
	);
};

export default 18px_scaleFromBottomLeft2;