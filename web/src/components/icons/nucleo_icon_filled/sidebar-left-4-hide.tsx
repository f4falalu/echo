import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_sidebarLeft4Hide(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sidebar left 4 hide";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m13.75,8.25h-1.9395l.7197-.7197c.293-.293.293-.7676,0-1.0605s-.7676-.293-1.0605,0l-2,2c-.293.293-.293.7676,0,1.0605l2,2c.1465.1465.3384.2197.5303.2197s.3838-.0732.5303-.2197c.293-.293.293-.7676,0-1.0605l-.7197-.7197h1.9395c.4141,0,.75-.3359.75-.75s-.3359-.75-.75-.75Z" fill={secondaryfill} strokeWidth="0"/>
		<path d="m14.25,16H3.75c-1.5166,0-2.75-1.2334-2.75-2.75V4.75c0-1.5166,1.2334-2.75,2.75-2.75h10.5c1.5166,0,2.75,1.2334,2.75,2.75v8.5c0,1.5166-1.2334,2.75-2.75,2.75ZM3.75,3.5c-.6895,0-1.25.5605-1.25,1.25v8.5c0,.6895.5605,1.25,1.25,1.25h10.5c.6895,0,1.25-.5605,1.25-1.25V4.75c0-.6895-.5605-1.25-1.25-1.25H3.75Z" fill={fill} strokeWidth="0"/>
		<path d="m7.75,13h-3c-.4141,0-.75-.3359-.75-.75v-6.5c0-.4141.3359-.75.75-.75h3c.4141,0,.75.3359.75.75v6.5c0,.4141-.3359.75-.75.75Z" fill={secondaryfill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default 18px_sidebarLeft4Hide;