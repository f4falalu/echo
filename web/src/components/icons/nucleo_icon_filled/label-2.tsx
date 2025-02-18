import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_label2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px label 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.095,5.348l-3.92-3.547c-.67-.605-1.679-.605-2.348,0l-3.921,3.547h0c-.575,.521-.905,1.264-.905,2.04v6.862c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V7.388c0-.775-.33-1.519-.905-2.04Zm-5.095,.152c.689,0,1.25,.561,1.25,1.25s-.561,1.25-1.25,1.25-1.25-.561-1.25-1.25,.561-1.25,1.25-1.25Zm2.25,8.5H6.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_label2;