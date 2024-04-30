<script lang="ts">
	import BlockWrapper from "$lib/components/BlockWrapper.svelte";
	import { onMount } from "svelte";
	import { spring } from "svelte/motion";

	import { writable } from "svelte/store";
	import hljs from "highlight.js/lib/common";
	import { detect } from "program-language-detector";
	import BlockCreator from "$lib/components/BlockCreator.svelte";

	import { boardZoom } from "$lib/stores";

	export let data;

	let { id, session, workspace, supabase, sessionRealtimeStateId } = data;
	$: ({ id, session, workspace, supabase, sessionRealtimeStateId } = data);
	let blocks = writable(new Array<Block>());
	let tags = writable(new Array<Tag>());

	let innerHeight: number;
	let innerWidth: number;
	let devicePixelRatio: number;
	let blockSize = 66;

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
		const t = await supabase
			.from("tags")
			.select()
			.eq("workspace_id", workspace.id);
		//@ts-ignore
		tags.set(t.data);
		//@ts-ignore
		blocks.set(b.data);

		return null;
	}

	function isCodeOrText(input: string): boolean {
		// Define a list of common code-related keywords and their minimum length
		const keywords: Record<string, number> = {
			function: 5,
			if: 2,
			for: 3,
			while: 5,
			return: 6,
			var: 3,
			let: 3,
			const: 5,
			class: 5,
		};

		// Check if the input contains any of the keywords with a minimum length requirement
		for (const keyword in keywords) {
			if (input.includes(keyword) && input.length > keywords[keyword]) {
				return true;
			}
		}

		// Check for common code-related symbols and operators
		if (/[\{\}\[\]\(\);=+\-*\/%<>!&\|]/.test(input)) {
			return true;
		}

		// Check for comments (e.g., // or /* */)
		if (/\b\/\/|\/\*|\*\/\b/.test(input)) {
			return true;
		}

		return false;
	}

	const handleBlockUpdates = (payload: any) => {
		let differences: any = {};
		for (const key in payload.new) {
			if (payload.old[key] !== payload.new[key]) {
				differences[key] = {
					old: payload.old[key],
					new: payload.new[key],
				};
			}
		}
		if (payload.new.realtime_session == sessionRealtimeStateId) return;
		let temp = $blocks;
		let bIndex = temp.findIndex((block: any) => block.id === payload.new.id);
		for (const key in differences) {
			temp[bIndex][key] = differences[key].new;
		}
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

	function findTag(id: string | undefined): Tag {
		if (!id)
			return {
				id: "",
				name: "",
				color: "",
			};
		console.log(id);
		let found: Tag = $tags.find((tag: Tag) => tag.id === id) || {
			id: "",
			name: "",
			color: "",
		};
		console.log(found, $tags);
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
	async function createBlock(e: CustomEvent) {
		if (e.detail) {
			const { error } = await supabase.from("blocks").insert({
				workspace_id: workspace.id,
				user_id: session.user.id,
				content: "",
				position: e.detail.position,
				tag_id: null,
				block_type: "text",
			});
			if (error) {
				console.log(error);
			}
		}
	}

	async function handleTextPasted(text: string) {
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
		} else if (detect(text) != "Unknown") {
			const { error } = await supabase.from("blocks").insert({
				workspace_id: workspace.id,
				user_id: session.user.id,
				content: text,
				position: { x: 1, y: 1, w: 1, h: 1 },
				tag_id: null,
				block_type: "code",
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
	let workspaceBounds: any = spring(
		{
			widthMinimum: 0,
			heightMinimum: 0,
		},
		{
			stiffness: 0.25,
			damping: 0.75,
		}
	);
	let scrollX = 0;
	let scrollY = 0;
	let zoom = 0.5;
	boardZoom.set(zoom);
	let wheel = false;
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.ctrlKey) {
			let zoomDelta = e.deltaY / 500;
			zoom -= zoomDelta;
			if (zoom < 0.1) zoom = 0.1;
			if (zoom > 1) zoom = 1;
			scrollX += e.deltaX * zoomDelta;
			scrollY += e.deltaY * zoomDelta;

			boardZoom.set(zoom);
		} else {
			scrollX += e.deltaX / zoom;
			scrollY += e.deltaY / zoom;
		}
	}
	function zoomTranslatePercent(zoom: number): number {
		let a: number = 109811.442;
		let b: number = -109811.442;
		let c: number = 2196.22885;
		let d: number = -0.000000203684499;
		return (a * zoom + b) / (c * zoom + d);
	}
	let mousePanning = false;
	function handleMouseDown(e: MouseEvent) {
		"";
		if (e.button === 1) {
			mousePanning = true;
			mVecX = 0;
			mVecY = 0;
			prevMouseX = e.clientX;
			prevMouseY = e.clientY;
		}
	}
	let prevMouseX = 0;
	let prevMouseY = 0;
	let mVecX = 0;
	let mVecY = 0;
	function handleMouseMove(e: MouseEvent) {
		if (mousePanning) {
			let deltaX = e.clientX - prevMouseX;
			let deltaY = e.clientY - prevMouseY;
			deltaX /= zoom;
			deltaY /= zoom;
			scrollX -= deltaX;
			scrollY -= deltaY;
			//calculate motion vector for if the mouse cancels right now
			mVecX = deltaX;
			mVecY = deltaY;
			prevMouseX = e.clientX;
			prevMouseY = e.clientY;
		}
	}
	function handleMouseUp(e: MouseEvent) {
		mousePanning = false;
		if (mVecX > 5 || mVecY > 5) requestAnimationFrame(mouseVelocityAnimation);
	}
	function lerp(a: number, b: number, t: number) {
		return a + (b - a) * t;
	}
	function mouseVelocityAnimation() {
		if (!mousePanning && (mVecX != 0 || mVecY != 0)) {
			scrollX -= mVecX;
			scrollY -= mVecY;
			let friction = 0.98;
			mVecX *= friction;
			mVecY *= friction;
			if (Math.abs(mVecX) < 1 && Math.abs(mVecY) < 1) {
				mVecX = 0;
				mVecY = 0;
			}
		}
		requestAnimationFrame(mouseVelocityAnimation);
	}
	let boundsStyleString: string = "";
	$: boundsStyleString = `background-position: ${scrollX * -1}px ${
		scrollY * -1
	}px;`;
	let zoomStyleString: string = "";
	$: zoomStyleString = `transform: scale(${zoom}) translate(${zoomTranslatePercent(
		zoom
	)}%, ${zoomTranslatePercent(zoom)}%); width: ${100 / zoom}vw; height: ${
		100 / zoom
	}vh;`;
	onMount(() => {
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
		fetchData();
	});
	function dummy() {
		return null;
	}
</script>

<svelte:window
	on:paste={pasteHandler}
	on:wheel|nonpassive={handleWheel}
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	bind:innerHeight
	bind:innerWidth
	bind:devicePixelRatio
/>
{id}
<div id="block-wrapper">
	<div id="main-blocks" style={boundsStyleString + zoomStyleString}>
		{#each $blocks as block (block.id)}
			<BlockWrapper
				on:positionChange={handleBlockPositionChanged}
				on:updateTextContent={handleBlockTextUpdate}
				{block}
				{scrollX}
				{scrollY}
				tag={findTag(block.tag_id)}
			/>
		{/each}
	</div>
</div>
<!--
<BlockCreator on:createBlock={createBlock} {scrollX} {scrollY}></BlockCreator>
-->
