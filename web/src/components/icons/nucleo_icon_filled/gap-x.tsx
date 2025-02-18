import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function gapX(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "gap x";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m15.25,2h-1c-1.5166,0-2.75,1.2334-2.75,2.75v8.5c0,1.5166,1.2334,2.75,2.75,2.75h1c.4141,0,.75-.3359.75-.75V2.75c0-.4141-.3359-.75-.75-.75Z" fill={fill} strokeWidth="0"/>
		<path d="m3.75,2h-1c-.4141,0-.75.3359-.75.75v12.5c0,.4141.3359.75.75.75h1c1.5166,0,2.75-1.2334,2.75-2.75V4.75c0-1.5166-1.2334-2.75-2.75-2.75Z" fill={fill} strokeWidth="0"/>
		<path d="m9,12c-.4141,0-.75-.3359-.75-.75v-4.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v4.5c0,.4141-.3359.75-.75.75Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default gapX;