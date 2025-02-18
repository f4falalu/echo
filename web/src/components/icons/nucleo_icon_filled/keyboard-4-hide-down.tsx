import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_keyboard4HideDown(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px keyboard 4 hide down";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.625,3.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5Zm-2.75,0c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5Zm-1.25,.5c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Zm5.625,3H6.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.625-3c0,.276-.224,.5-.5,.5h-.5c-.276,0-.5-.224-.5-.5v-.5c0-.276,.224-.5,.5-.5h.5c.276,0,.5,.224,.5,.5v.5Z" fill={fill}/>
		<path d="M9,18c-.192,0-.384-.073-.53-.22l-2.5-2.5c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.97,1.97,1.97-1.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.5,2.5c-.146,.146-.338,.22-.53,.22Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default 18px_keyboard4HideDown;