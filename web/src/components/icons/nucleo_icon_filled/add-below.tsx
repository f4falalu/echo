import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function addBelow(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "add below";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m12,12h-2.25v-2.25c0-.4141-.3359-.75-.75-.75s-.75.3359-.75.75v2.25h-2.25c-.4141,0-.75.3359-.75.75s.3359.75.75.75h2.25v2.25c0,.4141.3359.75.75.75s.75-.3359.75-.75v-2.25h2.25c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m15.25,7.5H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z" fill={fill} strokeWidth="0"/>
		<path d="m15.25,4H2.75c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h12.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default addBelow;