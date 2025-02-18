import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_microphone2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px microphone 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M4.25,7.5H13.75c.414,0,.75-.336,.75-.75v-.75c0-3.033-2.468-5.5-5.5-5.5S3.5,2.967,3.5,6v.75c0,.414,.336,.75,.75,.75Z" fill={secondaryfill}/>
		<path d="M15.25,9H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75c0,2.778,2.072,5.075,4.75,5.443v1.057c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.057c2.678-.368,4.75-2.665,4.75-5.443h.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_microphone2;