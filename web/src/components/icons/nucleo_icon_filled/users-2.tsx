import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function users2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "users 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M17.44,11.048c-.945-1.88-2.839-3.048-4.94-3.048-.283,0-.56,.031-.836,.063-.375,.044-.776,.145-1.18,.277,1.449,.73,2.664,1.899,3.43,3.414,.41,.811,.48,1.74,.243,2.614,.208-.022,.396-.049,.544-.083,.677-.158,1.188-.289,1.646-.452,.528-.188,.952-.599,1.163-1.125,.216-.539,.19-1.144-.07-1.661Z" fill={secondaryfill}/>
		<path d="M12.575,12.432c-1.07-2.117-3.207-3.432-5.575-3.432s-4.505,1.315-5.575,3.432c-.282,.558-.308,1.214-.069,1.802,.246,.607,.741,1.079,1.358,1.292,1.385,.48,2.826,.724,4.286,.724s2.901-.244,4.286-.724c.617-.214,1.112-.685,1.358-1.292,.238-.587,.213-1.244-.069-1.802Z" fill={fill}/>
		<path d="M12.5,1c-.575,0-1.108,.171-1.565,.452,.657,.846,1.065,1.896,1.065,3.048,0,.83-.222,1.601-.582,2.29,.337,.131,.699,.21,1.082,.21,1.654,0,3-1.346,3-3s-1.346-3-3-3Z" fill={secondaryfill}/>
		<circle cx="7" cy="4.5" fill={fill} r="3.5"/>
	</g>
</svg>
	);
};

export default users2;