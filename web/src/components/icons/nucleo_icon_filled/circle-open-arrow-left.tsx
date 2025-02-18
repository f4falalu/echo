import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function circleOpenArrowLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "circle open arrow left";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M7.561,9.75l1.97,1.97c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-3.25-3.25c-.293-.293-.293-.768,0-1.061l3.25-3.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.97,1.97h9.401c-.38-4.061-3.804-7.25-7.962-7.25C4.589,1,1,4.589,1,9s3.589,8,8,8c4.158,0,7.582-3.189,7.962-7.25H7.561Z" fill={fill}/>
	</g>
</svg>
	);
};

export default circleOpenArrowLeft;