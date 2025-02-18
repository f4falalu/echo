import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function databasePlus(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "database plus";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M10.02,15.219c-.331,.021-.672,.031-1.02,.031-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079,1.409,0,2.757-.16,3.898-.463,.4-.106,.639-.517,.533-.917-.106-.4-.514-.639-.917-.533-1.017,.271-2.232,.413-3.513,.413-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v3.629c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.25c0-1.97-3.521-3-7-3S2,2.28,2,4.25V13.75c0,1.97,3.521,3,7,3,.379,0,.751-.012,1.112-.034,.414-.025,.728-.381,.702-.795-.025-.413-.364-.73-.795-.702Z" fill={fill}/>
		<path d="M17.25,14h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z" fill={secondaryfill}/>
	</g>
</svg>
	);
};

export default databasePlus;