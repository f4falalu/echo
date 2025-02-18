import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_golfFlag(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px golf flag";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,8c-.169,0-.334,.007-.5,.012v3.238c0,1.241-1.009,2.25-2.25,2.25s-2.25-1.009-2.25-2.25v-2.414c-1.848,.72-3,1.847-3,3.164,0,2.28,3.439,4,8,4s8-1.72,8-4-3.439-4-8-4Z" fill={fill}/>
		<path d="M6.25,12c-.414,0-.75-.336-.75-.75V1.75c0-.254,.129-.492,.343-.63s.484-.158,.715-.054l5,2.25c.274,.124,.449,.399,.442,.7-.006,.301-.192,.568-.472,.68l-4.528,1.812v4.742c0,.414-.336,.75-.75,.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_golfFlag;