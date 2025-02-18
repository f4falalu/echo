import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_keyboard3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px keyboard 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="4.5" y="8.5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="1" y="8.5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="8" y="8.5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="11.5" y="8.5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="6.25" y="5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="2.75" y="5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="9.75" y="5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="13.25" y="5"/>
		<rect height="2" width="2" fill={fill} rx=".75" ry=".75" x="15" y="8.5"/>
		<path d="M4.5 12.75L13.5 12.75" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_keyboard3;