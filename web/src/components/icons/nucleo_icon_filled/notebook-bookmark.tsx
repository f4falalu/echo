import React from 'react';

type iconProps = {
	fill?: string,
	secondaryfill?: string,
	strokewidth?: number,
	width?: string,
	height?: string,
	title?: string
}

function notebookBookmark(props: iconProps) {
	const fill = props.fill || 'currentColor';
	const secondaryfill = props.secondaryfill || fill;
	const strokewidth = props.strokewidth || 1;
	const width = props.width || '1em';
	const height = props.height || '1em';
	const title = props.title || "notebook bookmark";

	return (
		<svg height={height} width={width} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
	<title>{title}</title>
	<g fill={fill}>
		<path d="M12.75,1H5.25c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V3.75c0-1.517-1.233-2.75-2.75-2.75ZM6,15.5h-.75c-.689,0-1.25-.561-1.25-1.25V3.75c0-.689,.561-1.25,1.25-1.25h.75V15.5ZM13,6.5c0,.202-.122,.385-.309,.462-.062,.026-.127,.038-.191,.038-.13,0-.258-.051-.354-.146l-1.146-1.146-1.146,1.146c-.144,.143-.358,.187-.545,.108-.187-.077-.309-.26-.309-.462V2.5h4V6.5Z" fill={fill}/>
	</g>
</svg>
	);
};

export default notebookBookmark;