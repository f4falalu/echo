import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function slidersVertical(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px sliders vertical";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.5.75v10.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m4,.75v10.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75Z" fill={fill} strokeWidth="0"/>
		<circle cx="8.75" cy="7.5" fill={secondaryfill} r="2.5" strokeWidth="0"/>
		<circle cx="3.25" cy="4.5" fill={fill} r="2.5" strokeWidth="0"/>
	</g>
</svg>
	);
};

export default slidersVertical;