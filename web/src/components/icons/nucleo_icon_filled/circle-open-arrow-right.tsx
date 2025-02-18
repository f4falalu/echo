import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function circleOpenArrowRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "circle open arrow right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M9,1C4.842,1,1.418,4.189,1.038,8.25H10.439l-1.97-1.97c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.25,3.25c.293,.293,.293,.768,0,1.061l-3.25,3.25c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.97-1.97H1.038c.38,4.061,3.804,7.25,7.962,7.25,4.411,0,8-3.589,8-8S13.411,1,9,1Z" fill={fill}/>
	</g>
</svg>
	);
};

export default circleOpenArrowRight;