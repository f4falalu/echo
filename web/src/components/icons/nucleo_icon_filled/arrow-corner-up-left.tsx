import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function arrowCornerUpLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "arrow corner up left";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.75,13.5H2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H10.75c.689,0,1.25-.561,1.25-1.25V2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V10.75c0,1.517-1.233,2.75-2.75,2.75Z" fill={secondaryfill}/>
		<path d="M16.25,6c-.192,0-.384-.073-.53-.22l-2.97-2.97-2.97,2.97c-.293,.293-.768,.293-1.061,0s-.293-.768,0-1.061l3.5-3.5c.293-.293,.768-.293,1.061,0l3.5,3.5c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z" fill={fill}/>
		<path d="M5.25,17c-.192,0-.384-.073-.53-.22l-3.5-3.5c-.293-.293-.293-.768,0-1.061l3.5-3.5c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.97,2.97,2.97,2.97c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z" fill={fill}/>
	</g>
</svg>
	);
};

export default arrowCornerUpLeft;