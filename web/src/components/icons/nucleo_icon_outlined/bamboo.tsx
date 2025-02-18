import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_bamboo(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px bamboo";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M11,9c-.225,.92-.431,2.133-.437,3.563-.006,1.487,.206,2.745,.437,3.687h-2s-2,0-2,0c.23-.943,.443-2.2,.437-3.688-.006-1.429-.212-2.643-.437-3.562,.225-.92,.431-2.133,.437-3.562,.006-1.487-.206-2.745-.437-3.688h4c-.23,.943-.443,2.2-.437,3.688,.006,1.429,.212,2.643,.437,3.562Z" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M11 9L7 9" fill="none" stroke={fill} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokewidth}/>
		<path d="M2,4h0c1.932,0,3.5,1.568,3.5,3.5h0c0,.276-.224,.5-.5,.5h0c-1.932,0-3.5-1.568-3.5-3.5h0c0-.276,.224-.5,.5-.5Z" fill={secondaryfill}/>
		<path d="M16,8h0c.276,0,.5,.224,.5,.5h0c0,1.932-1.568,3.5-3.5,3.5h0c-.276,0-.5-.224-.5-.5h0c0-1.932,1.568-3.5,3.5-3.5Z" fill={secondaryfill} transform="rotate(-180 14.5 10)"/>
	</g>
</svg>
	);
};

export default 18px_bamboo;