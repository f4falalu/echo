import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_connections3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px connections 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.47,7.523c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061L9.53,.962c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75Z" fill={fill}/>
		<path d="M7.522,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0L.962,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z" fill={fill}/>
		<path d="M9.53,10.477c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061l-2.75-2.75Z" fill={fill}/>
		<path d="M17.038,8.47l-2.75-2.75c-.293-.293-.768-.293-1.061,0l-2.75,2.75c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_connections3;