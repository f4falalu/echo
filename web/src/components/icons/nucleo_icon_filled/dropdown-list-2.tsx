import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function 18px_dropdownList2(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "18px dropdown list 2";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M14.25,13H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H14.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M14.25,16H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H14.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z" fill={secondaryfill}/>
		<path d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75v2.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-1.517-1.233-2.75-2.75-2.75Zm-5.75,6.5H3.75c-.689,0-1.25-.561-1.25-1.25v-2.5c0-.689,.561-1.25,1.25-1.25h4.75v5Zm5.833-2.833l-1.25,1.667c-.078,.105-.202,.167-.333,.167s-.255-.062-.333-.167l-1.25-1.667c-.095-.126-.11-.295-.039-.436,.071-.141,.215-.23,.373-.23h2.5c.158,0,.302,.089,.373,.23,.07,.141,.055,.31-.039,.436Z" fill={fill}/>
	</g>
</svg>
	);
};

export default 18px_dropdownList2;