import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function gauge2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "12px gauge 2";

	return (
		<svg height={height} width={width} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="m6,0C2.691,0,0,2.691,0,6s2.691,6,6,6,6-2.691,6-6S9.309,0,6,0Zm0,7.5c-.827,0-1.5-.673-1.5-1.5,0-.133.023-.26.056-.384l-1.836-1.836c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.836,1.836c.123-.033.25-.056.384-.056.827,0,1.5.673,1.5,1.5s-.673,1.5-1.5,1.5Z" fill={fill} strokeWidth="0"/>
	</g>
</svg>
	);
};

export default gauge2;