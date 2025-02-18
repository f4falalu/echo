import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 12px_maskCircle(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px mask circle";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm0,1.5c.3,0,.593.032.877.089.074.322.123.626.123.911,0,2.481-2.019,4.5-4.5,4.5-.285,0-.588-.049-.911-.124-.056-.284-.089-.576-.089-.876C1.5,3.519,3.519,1.5,6,1.5Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 12px_maskCircle;