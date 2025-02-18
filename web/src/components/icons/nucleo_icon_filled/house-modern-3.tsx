import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function houseModern3(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "house modern 3";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,14.5h-1.25V7.405l1.04,.303c.07,.02,.141,.03,.21,.03,.325,0,.625-.212,.72-.54,.116-.398-.112-.814-.51-.93L1.96,2.042c-.4-.114-.814,.113-.93,.51-.116,.398,.112,.814,.51,.93l1.46,.426V14.5H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.25v-3.5c0-.69,.56-1.25,1.25-1.25s1.25,.56,1.25,1.25v3.5h4.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75ZM7,9c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z" fill={fill}/>
	</g>
</svg>
	);
};

export default houseModern3;