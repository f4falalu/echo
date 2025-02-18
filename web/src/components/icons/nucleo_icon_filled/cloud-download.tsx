import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function cloudDownload(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "cloud download";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.146,6.327c-.442-2.463-2.611-4.327-5.146-4.327-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,2.068,1.682,3.75,3.75,3.75h7.75c2.481,0,4.5-2.019,4.5-4.5,0-1.854-1.15-3.503-2.854-4.173Zm-2.366,3.704l-2.25,2.25c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.97,.97v-3.189c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.189l.97-.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z" fill={fill}/>
	</g>
</svg>
	);
};

export default cloudDownload;