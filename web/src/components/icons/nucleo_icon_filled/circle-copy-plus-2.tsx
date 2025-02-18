import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_circleCopyPlus2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px circle copy plus 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.75,17c-1.445,0-2.854-.504-3.968-1.421-.32-.263-.366-.736-.103-1.056,.264-.32,.736-.365,1.056-.103,.846,.696,1.916,1.079,3.015,1.079,2.619,0,4.75-2.131,4.75-4.75,0-1.098-.383-2.169-1.079-3.015-.264-.32-.217-.792,.103-1.056,.319-.262,.791-.218,1.056,.103,.916,1.114,1.421,2.523,1.421,3.968,0,3.446-2.804,6.25-6.25,6.25Z" fill={secondaryfill}/>
		<path d="M7.25,1C3.804,1,1,3.804,1,7.25s2.804,6.25,6.25,6.25,6.25-2.804,6.25-6.25S10.696,1,7.25,1Zm2.5,7h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_circleCopyPlus2;