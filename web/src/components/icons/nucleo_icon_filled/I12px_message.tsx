import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function message(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px message";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m9.25.501H2.75C1.233.501,0,1.735,0,3.251v3.5c0,1.517,1.233,2.75,2.75,2.75h.25v1.75c0,.291.168.556.432.679.102.047.21.071.318.071.172,0,.343-.059.48-.174l2.792-2.326h2.229c1.517,0,2.75-1.233,2.75-2.75v-3.5c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default message;