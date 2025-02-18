import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_caretRight(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px caret right";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.611,7.522L6.687,2.497c-.54-.342-1.223-.363-1.781-.055-.559,.308-.906,.895-.906,1.533V14.024c0,.638,.347,1.226,.906,1.533,.263,.145,.554,.217,.844,.217,.326,0,.652-.091,.938-.272l7.923-5.024c.509-.323,.812-.875,.812-1.478s-.304-1.155-.812-1.478Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_caretRight;