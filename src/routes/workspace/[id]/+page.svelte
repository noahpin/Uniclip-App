<script lang="ts">
	import Block from "$lib/components/Block.svelte";

	export let data;

	let { id, session, workspace, blocks, tags } = data;
	$: ({ id, session, workspace, blocks, tags } = data);
	interface Tag {
		id: number;
		name: string;
        color: string;
	}
</script>

{id}
<div id="main-blocks">
	{#each blocks as block}
    
		<Block {block} tag={tags.find(tg => tg.id === block.tag_id)}
			>{block.content}</Block
		>
	{/each}
</div>
