import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_userVoice(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px user voice";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="7.5" cy="5" fill="none" r="2.25" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M12.341,6.591c.407-.407,.659-.97,.659-1.591,0-.621-.252-1.184-.659-1.591" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M14.639,8.889c.995-.995,1.611-2.37,1.611-3.889s-.616-2.894-1.611-3.889" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11.54,14.817c.837-.291,1.266-1.257,.866-2.048-.906-1.791-2.761-3.02-4.906-3.02s-4,1.228-4.906,3.02c-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683s3.009-.325,4.04-.683Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_userVoice;