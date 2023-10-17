<script lang="ts">
	export let block: {
		id: string;
		content: string;
		position: { x: number; y: number; w: number; h: number };
		tag_id?: string;
	} = {
		id: "",
		content: "",
		position: { x: 0, y: 0, w: 0, h: 0 },
		tag_id: "",
	};

	export let tag: {
		id: string;
		name: string;
		color: string;
	} = {
        id: "",
        name: "",
        color: "",
    };
</script>

<div
	class="block"
	style={`width: calc(${block.position.w} * var(--blockSize) + ${
		block.position.w - 1
	} * var(--blockPadding)); 
height: calc(${block.position.h} * var(--blockSize) + ${
		block.position.h - 1
	} * var(--blockPadding));
top: calc(${
		block.position.y
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		block.position.y - 1
	} * var(--blockSize));
left: calc(${
		block.position.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		block.position.x - 1
	} * var(--blockSize));
    box-shadow: 5px 5px 0px ${tag.color}
`}
>
	<slot />
</div>
