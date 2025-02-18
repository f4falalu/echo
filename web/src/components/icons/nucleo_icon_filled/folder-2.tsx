import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function folder2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "folder 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.75,4.5h-4.279l-1.3-1.53c-.523-.616-1.288-.97-2.096-.97h-1.825c-1.517,0-2.75,1.233-2.75,2.75V12.75c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V7.25c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default folder2;