import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_windowBottomRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px window bottom right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3.75,15.5H14.25c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75Zm6.75-5.25c0-.69,.56-1.25,1.25-1.25h2.5c.69,0,1.25,.56,1.25,1.25v2.5c0,.69-.56,1.25-1.25,1.25h-2.5c-.69,0-1.25-.56-1.25-1.25v-2.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_windowBottomRight;