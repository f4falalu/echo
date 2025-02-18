import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function curve(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "curve";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M2.75,15.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c4.058,0,4.707-2.296,5.528-5.204,.834-2.951,1.779-6.296,6.972-6.296,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-4.058,0-4.707,2.296-5.528,5.204-.834,2.951-1.779,6.296-6.972,6.296Z" fill={fill}/>
	</g>
</svg>
	);
};

export default curve;