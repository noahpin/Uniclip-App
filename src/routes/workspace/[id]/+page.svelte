<script lang="ts">
	import Block from "$lib/components/Block.svelte";

	export let data;

	let { id, session, workspace, supabase } = data;
	$: ({ id, session, workspace, supabase } = data);
	let blocks: any;
	let tags: any;

	async function fetchData() {
		const b = await supabase
			.from("blocks")
			.select()
			.eq("workspace_id", workspace.id);
		blocks = b.data;
		const t = await supabase
			.from("tags")
			.select()
			.eq("workspace_id", workspace.id);
        tags = t.data;

		return null;
	}

	const handleBlockUpdates = (payload: any) => {
		console.log("Change received!", payload.new.id, payload.new.content);
		blocks[blocks.findIndex((block: any) => block.id === payload.new.id)] =
			payload.new;
	};

	// Listen to inserts
	supabase
		.channel("blocks")
		.on(
			"postgres_changes",
			{
				event: "UPDATE",
				schema: "public",
				filter: `workspace_id=eq.${workspace.id}`,
				table: "blocks",
			},
			handleBlockUpdates
		)
		.subscribe();

	interface Tag {
		id: string;
		name: string;
		color: string;
	}
	function findTag(id: string): Tag {
		return tags.find((tag: any) => tag.id === id);
	}
</script>

{id}
<div id="main-blocks">
	{#await fetchData() then data}
		{#each blocks as block (block)}
			<Block {block} tag={findTag(block.tag_id)}
				>{block.content} {block.date_created} {new Date().valueOf()}</Block
			>
		{/each}
	{/await}
</div>
