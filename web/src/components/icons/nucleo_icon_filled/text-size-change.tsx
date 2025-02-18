import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function textSizeChange(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "text size change";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13,2H2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H7V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.5h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={fill}/>
		<path d="M16.25,9.75c-.192,0-.384-.073-.53-.22l-1.72-1.72-1.72,1.72c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z" fill={secondaryfill}/>
		<path d="M14,15c-.192,0-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.72,1.72,1.72-1.72c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.25,2.25c-.146,.146-.338,.22-.53,.22Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default textSizeChange;