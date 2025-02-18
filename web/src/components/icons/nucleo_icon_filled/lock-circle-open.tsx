import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_lockCircleOpen(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px lock circle open";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M6.25,8.377c-.414,0-.75-.336-.75-.75v-3.127c0-1.93,1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75c0-1.103-.897-2-2-2s-2,.897-2,2v3.127c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M9,6c-3.033,0-5.5,2.467-5.5,5.5s2.467,5.5,5.5,5.5,5.5-2.467,5.5-5.5-2.467-5.5-5.5-5.5Zm.75,6c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_lockCircleOpen;