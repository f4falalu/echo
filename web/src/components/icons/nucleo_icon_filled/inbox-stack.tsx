import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function inboxStack(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "inbox stack";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,6.5H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H14.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M12.25,3.5H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M16.949,8.605c-.069-.352-.378-.605-.736-.605h-4.463c-.414,0-.75,.336-.75,.75v1c0,.138-.112,.25-.25,.25h-3.5c-.138,0-.25-.112-.25-.25v-1c0-.414-.336-.75-.75-.75H1.787c-.358,0-.667,.254-.736,.605-.033,.172-.051,.347-.051,.523v3.121c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-3.121c0-.177-.018-.351-.051-.523Z" fill={fill}/>
	</g>
</svg>
	);
};

export default inboxStack;