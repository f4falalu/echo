import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_keyboard4(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px keyboard 4";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="8.5" width="14.5" fill="none" rx="2" ry="2" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="1.75" y="4.75"/>
		<rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="6.875" y="7"/>
		<rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="4.125" y="7"/>
		<rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="9.625" y="7"/>
		<rect height="1.5" width="1.5" fill={secondaryfill} rx=".5" ry=".5" x="12.375" y="7"/>
		<path d="M11.25 10.25L6.75 10.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_keyboard4;