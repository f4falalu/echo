import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_shopping(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px shopping";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10,5.51c-.368-.465-.937-.76-1.569-.76H4.069c-1.031,0-1.893,.784-1.991,1.81l-.619,6.5c-.112,1.174,.812,2.19,1.991,2.19h1.55" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M9.821,8.25h4.357c1.032,0,1.895,.786,1.991,1.813l.375,4c.11,1.173-.813,2.187-1.991,2.187h-5.107c-1.178,0-2.101-1.014-1.991-2.187l.375-4c.096-1.028,.959-1.813,1.991-1.813Z" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M4.25,4.75V2.75c0-1.105,.895-2,2-2h0c1.105,0,2,.895,2,2v2" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M13.75,10.75v.25c0,.966-.784,1.75-1.75,1.75h0c-.966,0-1.75-.784-1.75-1.75v-.25" fill="none" stroke={secondaryfill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
	</g>
</svg>
	);
};

export default 18px_shopping;