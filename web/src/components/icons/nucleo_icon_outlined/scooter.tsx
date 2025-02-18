import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_scooter(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px scooter";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7,12c0,1.243-1.007,2.25-2.25,2.25s-2.25-1.007-2.25-2.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25,12c0,1.243,1.007,2.25,2.25,2.25s2.25-1.007,2.25-2.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.25,5.75h-1c-.828,0-1.5-.672-1.5-1.5h0c0-.828,.672-1.5,1.5-1.5h1v3Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.25,2.75h.672c.48,0,.893,.341,.982,.813l.845,4.437" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.763,8.503c.503-.318,1.098-.503,1.737-.503,1.795,0,3.25,1.455,3.25,3.25H1.25v-.5c0-2.209,1.791-4,4-4h2.5c.552,0,1,.448,1,1v3.5" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<rect height="1.5" width="4.5" fill={fill} rx=".5" ry=".5" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth} x="3.75" y="4.75"/>
	</g>
</svg>
	);
};

export default 18px_scooter;