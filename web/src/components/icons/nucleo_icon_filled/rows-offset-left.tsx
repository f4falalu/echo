import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_rowsOffsetLeft(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px rows offset left";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<rect height="4" width="10.5" fill={fill} rx="1.75" ry="1.75" x="6.5" y="7"/>
		<rect height="4" width="10.5" fill={fill} rx="1.75" ry="1.75" x="6.5" y="1.5"/>
		<rect height="4" width="10.5" fill={fill} rx="1.75" ry="1.75" x="6.5" y="12.5"/>
		<path d="M4.78,5.97c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.97-1.97,1.97-1.97c.293-.293,.293-.768,0-1.061Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_rowsOffsetLeft;