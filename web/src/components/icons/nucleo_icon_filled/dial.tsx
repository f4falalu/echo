import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function dial(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "dial";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<circle cx="9" cy=".75" fill={secondaryfill} r=".75"/>
		<circle cx="14.834" cy="3.166" fill={secondaryfill} r=".75"/>
		<circle cx="17.25" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="14.834" cy="14.834" fill={secondaryfill} r=".75"/>
		<circle cx="3.166" cy="14.834" fill={secondaryfill} r=".75"/>
		<circle cx=".75" cy="9" fill={secondaryfill} r=".75"/>
		<circle cx="3.166" cy="3.166" fill={secondaryfill} r=".75"/>
		<path d="M8.47,9.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l4.203,4.204c.791-1.016,1.266-2.289,1.266-3.674,0-3.309-2.691-6-6-6S3,5.691,3,9s2.691,6,6,6c1.384,0,2.657-.476,3.673-1.266l-4.203-4.204Z" fill={fill}/>
	</g>
</svg>
	);
};

export default dial;