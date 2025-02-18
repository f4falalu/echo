import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function rectLogout(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "rect logout";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M13.75,1.5h-5.5c-1.517,0-2.75,1.233-2.75,2.75v4h3.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-3.75v4c0,1.517,1.233,2.75,2.75,2.75h5.5c1.517,0,2.75-1.233,2.75-2.75V4.25c0-1.517-1.233-2.75-2.75-2.75Z" fill={fill}/>
		<path d="M2.561,9.75h2.939v-1.5H2.561l1.47-1.47c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L.22,8.47c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default rectLogout;