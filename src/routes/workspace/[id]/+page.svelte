<script lang="ts">
	import BlockWrapper from "$lib/components/BlockWrapper.svelte";
	import { writable } from "svelte/store";

	export let data;

	let { id, session, workspace, supabase, sessionRealtimeStateId } = data;
	$: ({ id, session, workspace, supabase, sessionRealtimeStateId } = data);
	let blocks = writable(new Array<Block>());
	let tags = writable(new Array<Tag>());

	const isValidUrl = (urlString: string) => {
		try {
			return Boolean(new URL(urlString));
		} catch (e) {
			return false;
		}
	};
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

		return null;
	}

	const handleBlockUpdates = (payload: any) => {
		if (payload.new.realtime_session == sessionRealtimeStateId) return;
		let temp = $blocks;
		temp[temp.findIndex((block: any) => block.id === payload.new.id)] =
			payload.new;
		blocks.set(temp);
	};

	const handleBlockInserts = (payload: any) => {
		console.log("New block!", payload.new.id);
		blocks.set([...$blocks, payload.new]);
	};

	const handleBlockDeletes = (payload: any) => {
		console.log("Block deleted!", payload.old.id);
		blocks.set($blocks.filter((block: any) => block.id !== payload.old.id));
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
		.on(
			"postgres_changes",
			{
				event: "DELETE",
				schema: "public",
				filter: `workspace_id=eq.${workspace.id}`,
				table: "blocks",
			},
			handleBlockDeletes
		)
		.subscribe();

	function findTag(id: string | undefined): Tag {
		let found: Tag = $tags.find((tag: Tag) => tag.id === id) || {
			id: "",
			name: "",
			color: "",
		};
		return found;
	}

	async function handleBlockPositionChanged(e: CustomEvent) {
		//console.log(e.detail, sessionRealtimeStateId);
		const { error } = await supabase
			.from("blocks")
			.update({
				position: e.detail.position,
				realtime_session: sessionRealtimeStateId,
			})
			.eq("id", e.detail.id);
	}
	async function handleBlockTextUpdate(e: CustomEvent) {
		const { error } = await supabase
			.from("blocks")
			.update({
				content: e.detail.content,
				realtime_session: sessionRealtimeStateId,
			})
			.eq("id", e.detail.id);
	}

	async function pasteHandler(e: ClipboardEvent) {
		console.log(e);
		if (e.clipboardData) {
			// Check for text data
			if (e.clipboardData.types.includes("text/plain")) {
				// Retrieve and handle text data
				const pastedText = e.clipboardData.getData("text/plain");
				handleTextPasted(pastedText);
			}

			// Check for image data
			if (e.clipboardData.types.includes("Files")) {
				// Retrieve and handle image data
				const pastedFiles = e.clipboardData.files;
				handleImagesPasted(pastedFiles);
			}
		}
	}

	async function handleTextPasted(text: string) {
		console.log(text);
		if (isValidUrl(text)) {
			const { error } = await supabase.from("blocks").insert({
				workspace_id: workspace.id,
				user_id: session.user.id,
				content: text,
				position: { x: 1, y: 1, w: 1, h: 1 },
				tag_id: null,
				block_type: "link",
			});
			if (error) {
				console.log(error);
			}
		} else {
			const { error } = await supabase.from("blocks").insert({
				workspace_id: workspace.id,
				user_id: session.user.id,
				content: text,
				position: { x: 1, y: 1, w: 1, h: 1 },
				tag_id: null,
				block_type: "text",
			});
			if (error) {
				console.log(error);
			}
		}
	}

	async function handleImagesPasted(files: FileList) {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (file.type.startsWith("image/")) {
				const imgPath = `${session.user.id}/${crypto.randomUUID()}.png`;
				const { data, error } = await supabase.storage
					.from("user-images")
					.upload(imgPath, file, {
						contentType: "image/png",
					});

				const { data: publicUrlData } = await supabase.storage
					.from("user-images")
					.getPublicUrl(imgPath);

				console.log(publicUrlData.publicUrl);

				if (!error) {
					const create = await supabase.from("blocks").insert({
						workspace_id: workspace.id,
						user_id: session.user.id,
						content: publicUrlData.publicUrl,
						position: { x: 1, y: 1, w: 1, h: 1 },
						tag_id: null,
						block_type: "image",
					});
				}
			}
		}
	}
</script>

<svelte:window on:paste={pasteHandler} />
{id}
<div id="main-blocks">
	{#await fetchData() then data}
		{#each $blocks as block (block)}
			<BlockWrapper
				on:positionChange={handleBlockPositionChanged}
				on:updateTextContent={handleBlockTextUpdate}
				{block}
				tag={findTag(block.tag_id)}
			/>
		{/each}
	{/await}
</div>
