import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_faceMustache(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px face mustache";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm3,7c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm-6,0c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm7.36,4.339c-.52,1.023-1.552,1.262-2.128,1.262-.662,0-1.631-.425-2.231-1.377-.6,.953-1.569,1.377-2.231,1.377-.577,0-1.608-.239-2.128-1.262-.093-.182,.07-.379,.272-.352,.982,.13,1.669-1.014,2.613-1.374,.474-.181,1.135-.132,1.475,.454,.34-.586,1.001-.635,1.475-.454,.944,.36,1.63,1.503,2.613,1.374,.203-.027,.365,.17,.272,.352Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_faceMustache;