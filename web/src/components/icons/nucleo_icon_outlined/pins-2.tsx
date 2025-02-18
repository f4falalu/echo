import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_pins2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px pins 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.75,8.325c0,2.155-2.817,5.616-4.113,7.094-.339,.387-.936,.387-1.275,0-1.295-1.477-4.113-4.938-4.113-7.094,0-2.869,2.455-4.534,4.75-4.534s4.75,1.665,4.75,4.534Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M1.756,8.569c-.581-.982-1.006-1.971-1.006-2.763,0-2.567,2.196-4.057,4.25-4.057,.359,0,.722,.046,1.078,.134" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M16.244,8.569c.581-.982,1.006-1.971,1.006-2.763,0-2.567-2.196-4.057-4.25-4.057-.359,0-.722,.046-1.078,.134" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<circle cx="9" cy="8.75" fill="none" r="1.5" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_pins2;