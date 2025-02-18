import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_tableColsMerge(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px table cols merge";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M8.25,13.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75h3.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75h-3.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5v-2.75Zm-.47-2.53c.293,.293,.293,.768,0,1.061s-.768,.293-1.061,0l-2.25-2.25c-.146-.146-.22-.338-.22-.53s.073-.384,.22-.53l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-.97,.97h4.379l-.97-.97c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.25,2.25c.293,.293,.293,.768,0,1.061l-2.25,2.25c-.293,.293-.768,.293-1.061,0-.146-.146-.22-.338-.22-.53s.073-.384,.22-.53l.97-.97H6.811l.97,.97Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_tableColsMerge;