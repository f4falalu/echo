import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_pinTack2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px pin tack 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.081 14.919L6.409 11.591" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M10.371,15.553c.432-.557,1.02-1.47,1.348-2.718,.169-.642,.23-1.224,.243-1.701l3.005-3.005c.781-.781,.781-2.047,0-2.828l-2.268-2.268c-.781-.781-2.047-.781-2.828,0l-3.005,3.005c-.478,.013-1.059,.074-1.701,.243-1.248,.328-2.161,.916-2.718,1.348l7.925,7.925Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_pinTack2;