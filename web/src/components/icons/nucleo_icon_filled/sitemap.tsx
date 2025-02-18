import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_sitemap(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px sitemap";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.75,8h-3v-2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.75h-3c-1.517,0-2.75,1.233-2.75,2.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.689,.561-1.25,1.25-1.25h3v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h3c.689,0,1.25,.561,1.25,1.25v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-1.517-1.233-2.75-2.75-2.75Z" fill={secondaryfill}/>
		<circle cx="3.25" cy="14" fill={fill} r="2.5"/>
		<circle cx="14.75" cy="14" fill={fill} r="2.5"/>
		<circle cx="9" cy="14" fill={fill} r="2.5"/>
		<circle cx="9" cy="3.5" fill={fill} r="2.5"/>
	</g>
</svg>
	);
};

export default 18px_sitemap;