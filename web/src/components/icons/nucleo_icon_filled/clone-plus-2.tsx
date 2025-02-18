import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_clonePlus2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px clone plus 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M3,13.354c-.094,0-.189-.018-.281-.055-1.044-.423-1.718-1.424-1.718-2.55V3.75c0-1.516,1.234-2.75,2.75-2.75h7c1.126,0,2.127,.674,2.55,1.718,.155,.384-.03,.821-.414,.977-.383,.156-.821-.03-.977-.414-.192-.475-.647-.782-1.159-.782H3.75c-.689,0-1.25,.561-1.25,1.25v7c0,.512,.307,.967,.782,1.159,.384,.156,.569,.593,.414,.977-.118,.292-.399,.468-.696,.468Z" fill={secondaryfill}/>
		<path d="M14.25,4.5H7.25c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h7c1.517,0,2.75-1.233,2.75-2.75V7.25c0-1.517-1.233-2.75-2.75-2.75Zm-1,7h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_clonePlus2;