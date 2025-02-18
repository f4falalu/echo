import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function storageUnit(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "storage unit";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M16.25,6c-.109,0-.221-.024-.326-.075l-6.924-3.342L2.076,5.925c-.374,.179-.821,.024-1.001-.349s-.024-.821,.349-1.001L8.674,1.075c.206-.1,.446-.1,.652,0l7.25,3.5c.373,.18,.529,.628,.349,1.001-.129,.268-.397,.424-.676,.424Z" fill={secondaryfill}/>
		<path d="M15.25,8c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75,.75,.336,.75,.75v3.5c0,.414-.336,.75-.75,.75h-1.565c.194-.377,.315-.798,.315-1.25v-4.5c0-1.517-1.233-2.75-2.75-2.75h-1.5v3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-3.25h-1.5c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,.452,.12,.873,.315,1.25h-1.565c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75-.336,.75-.75-.336-.75-.75-.75c-1.241,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.009,2.25,2.25,2.25H15.25c1.241,0,2.25-1.009,2.25-2.25v-3.5c0-1.241-1.009-2.25-2.25-2.25Z" fill={fill}/>
	</g>
</svg>
	);
};

export default storageUnit;