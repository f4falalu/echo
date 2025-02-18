import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function doubleChevronUp(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "double chevron up";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9.53,3.47c-.293-.293-.768-.293-1.061,0L4.22,7.72c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l3.72-3.72,3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061L9.53,3.47Z" fill={fill}/>
		<path d="M9.53,8.22c-.293-.293-.768-.293-1.061,0l-4.25,4.25c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l3.72-3.72,3.72,3.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-4.25-4.25Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default doubleChevronUp;