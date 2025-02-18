import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_cropAlphaGrid(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px crop alpha grid";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6 6H7.5V7.5H6z" fill={secondaryfill}/>
		<path d="M9 6H10.5V7.5H9z" fill={secondaryfill}/>
		<path d="M10.5 7.5H12V9H10.5z" fill={secondaryfill}/>
		<path d="M7.5 7.5H9V9H7.5z" fill={secondaryfill}/>
		<path d="M6 9H7.5V10.5H6z" fill={secondaryfill}/>
		<path d="M9 9H10.5V10.5H9z" fill={secondaryfill}/>
		<path d="M10.5 10.5H12V12H10.5z" fill={secondaryfill}/>
		<path d="M7.5 10.5H9V12H7.5z" fill={secondaryfill}/>
		<path d="M6.75,4.25h6c.552,0,1,.448,1,1v11" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.75 4.25L4.25 4.25" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.25,13.75H5.25c-.552,0-1-.448-1-1V1.75" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_cropAlphaGrid;