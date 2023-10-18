<script lang="ts">
	import Block from "$lib/components/Block.svelte";
	import { writable } from "svelte/store";

	export let data;

	let { id, session, workspace, supabase } = data;
	$: ({ id, session, workspace, supabase } = data);
	let blocks = writable([]);
	let tags = writable([]);

	async function fetchData() {
		const b = await supabase
			.from("blocks")
			.select()
			.eq("workspace_id", workspace.id);
		//@ts-ignore
		blocks.set(b.data);
		const t = await supabase
			.from("tags")
			.select()
			.eq("workspace_id", workspace.id);
		//@ts-ignore
		tags.set(t.data);
        console.log($tags)

		return null;
	}

	const handleBlockUpdates = (payload: any) => {
		console.log("Change received!", payload.new.id, payload.new.content);
		let temp = $blocks;
		//@ts-ignore
		temp[temp.findIndex((block: any) => block.id === payload.new.id)] =
			payload.new;
		blocks.set(temp);
        
	};

	const handleBlockInserts = (payload: any) => {
		console.log("New block!", payload.new);
		//blocks.push(payload.new);
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
		.on(
			"postgres_changes",
			{
				event: "INSERT",
				schema: "public",
				filter: `workspace_id=eq.${workspace.id}`,
				table: "blocks",
			},
			handleBlockInserts
		)
		.subscribe();

	interface Tag {
		id: string;
		name: string;
		color: string;
	}
	function findTag(id: string) {
		if (!id) return { id: "", name: "", color: "" };
		console.log($tags);
		return $tags.find((tag: any) => tag.id === id);
	}
</script>

{id}
<div id="main-blocks">
	{#await fetchData() then data}
		{#each $blocks as block (block.id)}
			<Block {block} tag={findTag(block.tag_id)}>
				{block.content}
				{block.date_created}
				{new Date().valueOf()}
			</Block>
		{/each}
	{/await}
</div>
