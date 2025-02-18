import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function hospital(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "hospital";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m16.25,10h-1.25v1.5h1.25c.1377,0,.25.1123.25.25v3.5c0,.1377-.1123.25-.25.25h-2.25v1.5h2.25c.9648,0,1.75-.7852,1.75-1.75v-3.5c0-.9648-.7852-1.75-1.75-1.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m4,15.5H1.75c-.1377,0-.25-.1123-.25-.25v-3.5c0-.1377.1123-.25.25-.25h1.25v-1.5h-1.25c-.9648,0-1.75.7852-1.75,1.75v3.5c0,.9648.7852,1.75,1.75,1.75h2.25v-1.5Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m13.25,1H4.75c-.9648,0-1.75.7852-1.75,1.75v13.5c0,.4141.3359.75.75.75h3.25v-3.75c0-.4141.3359-.75.75-.75h2.5c.4141,0,.75.3359.75.75v3.75h3.25c.4141,0,.75-.3359.75-.75V2.75c0-.9648-.7852-1.75-1.75-1.75Zm-2,6.5h-1.5v1.5c0,.4141-.3359.75-.75.75s-.75-.3359-.75-.75v-1.5h-1.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h1.5v-1.5c0-.4141.3359-.75.75-.75s.75.3359.75.75v1.5h1.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default hospital;