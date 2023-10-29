<script lang="ts">
	import BlockCodeContent from "$lib/components/BlockCodeContent.svelte";
	import BlockTextContent from "$lib/components/BlockTextContent.svelte";
	import BlockImageContent from "$lib/components/BlockImageContent.svelte";
	import BlockLinkContent from "$lib/components/BlockLinkContent.svelte";

	import { scale } from "svelte/transition";

	import { createEventDispatcher } from "svelte";
	import { backOut, elasticOut } from "svelte/easing";
	import { spring } from "svelte/motion";

	let possibleBlockHits: any = {
		default: {
			bottom: true,
			top: true,
			left: true,
			right: true,
		},
		link: {
			bottom: false,
			top: false,
			left: true,
			right: true,
		},
	};

	export let block: Block


	export let tag: Tag = {
		id: "",
		name: "",
		color: "",
	};

	let hits =
		possibleBlockHits[block.block_type] || possibleBlockHits["default"];

	const dispatch = createEventDispatcher();

	let actualPosition = spring(
		{ ...block.position },
		{
			stiffness: 0.25,
			damping: 0.75,
		}
	);
	$: actualPosition.set({ ...block.position })

	let rotate = spring(0, {
		stiffness: 0.25,
		damping: 0.75,
	});
	let originPercent = 50;
	let yOrigin = 0.5;

	let stylestring = ``;
	$: stylestring = `width: calc(${$actualPosition.w} * var(--blockSize) + ${
		$actualPosition.w - 1
	} * var(--blockPadding)); 
height: calc(${$actualPosition.h} * var(--blockSize) + ${
		$actualPosition.h - 1
	} * var(--blockPadding));
top: calc(${
		$actualPosition.y
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		$actualPosition.y - 1
	} * var(--blockSize));
left: calc(${
		$actualPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$actualPosition.x - 1
	} * var(--blockSize));
	transform-origin: ${originPercent}% ${yOrigin * 100}%;
	transform: rotate(${$rotate}deg);
`;
	$: previewStyle = `width: calc(${block.position.w} * var(--blockSize) + ${
		block.position.w - 1
	} * var(--blockPadding)); 
height: calc(${$actualPosition.h} * var(--blockSize) + ${
		block.position.h - 1
	} * var(--blockPadding));
top: calc(${
		$previewPosition.y
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		$previewPosition.y - 1
	} * var(--blockSize));
left: calc(${
		$previewPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$previewPosition.x - 1
	} * var(--blockSize));
`;
	let moving: string = "";
	let pX: number = 0;
	let pY: number = 0;
	interface Position {
		x: number;
		y: number;
		w: number;
		h: number;
	}
	let initialPosition: Position = {
		...block.position,
	};
	let previewPosition = spring(
		{
			...block.position,
		},
		{
			stiffness: 0.25,
			damping: 0.75,
		}
	);
	let rotWeight = 0;
	let blockEl: HTMLElement;
	let useBlockPreview: boolean = false;
	function hitHandler(e: PointerEvent, side: any) {
		moving = side;
		pX = e.clientX;
		pY = e.clientY;
		initialPosition = { ...block.position };

		if (moving == "m") {
			originPercent =
				((e.clientX - blockEl.getBoundingClientRect().x) /
					blockEl.getBoundingClientRect().width) *
				100;

			rotWeight = (originPercent / 100 - 0.5) * 6;
			yOrigin = 0;
			raf();
			useBlockPreview = true;
		}
	}
	let rafId: number;
	function raf() {
		yOrigin = 0;
		rotate.update((n) => n / 1.4 - rotWeight);
		rafId = requestAnimationFrame(raf);
	}
	function moveHandler(e: PointerEvent) {
		if (moving == "") return;
		if (moving.includes("m")) {
			rotate.update((n) => n + e.movementX * 0.1);
			block.position.x = initialPosition.x - (pX - e.clientX) / 60;
			block.position.y = initialPosition.y - (pY - e.clientY) / 60;
		}
		if (moving.includes("b")) {
			block.position.h = Math.max(
				initialPosition.h + Math.round((e.clientY - pY) / 60),
				1
			);
		}
		if (moving.includes("t")) {
			block.position.h = Math.max(
				initialPosition.h + Math.round((pY - e.clientY) / 60),
				1
			);
			if (initialPosition.h + Math.round((pY - e.clientY) / 60) >= 1) {
				block.position.h =
					initialPosition.h + Math.round((pY - e.clientY) / 60);
				block.position.y =
					initialPosition.y - Math.round((pY - e.clientY) / 60);
			}
		}
		if (moving.includes("l")) {
			if (initialPosition.w + Math.round((pX - e.clientX) / 60) >= 1) {
				block.position.w =
					initialPosition.w + Math.round((pX - e.clientX) / 60);
				block.position.x =
					initialPosition.x - Math.round((pX - e.clientX) / 60);
			}
		}
		if (moving.includes("r")) {
			block.position.w = Math.max(
				initialPosition.w + Math.round((e.clientX - pX) / 60),
				1
			);
		}
		if (JSON.stringify(block.position) != JSON.stringify(initialPosition)) {
			actualPosition.set({ ...block.position });
			previewPosition.set({
				w: block.position.w,
				h: block.position.h,
				x: Math.round(block.position.x),
				y: Math.round(block.position.y),
			});
		}
	}
	function endHandler() {
		cancelAnimationFrame(rafId);
		moving = "";
		block.position.x = Math.round(block.position.x);
		block.position.y = Math.round(block.position.y);
		actualPosition.set({ ...block.position });
		if (JSON.stringify(block.position) != JSON.stringify(initialPosition)) {
			dispatch("positionChange", { id: block.id, position: block.position });
		}
		initialPosition = block.position;
		rotate.set(0);
		useBlockPreview = false;
		setTimeout(() => {
			yOrigin = 0.5;
		}, 300);
	}

	function increaseHeightFromContent(e: { detail: { height: number } }) {
		block.position.h += Math.ceil(e.detail.height / 60);
		actualPosition.set({ ...block.position });
		if (JSON.stringify(block.position) != JSON.stringify(initialPosition)) {
			dispatch("positionChange", { id: block.id, position: block.position });
		}
	}
</script>

<svelte:window
	on:pointermove|preventDefault={moveHandler}
	on:pointerup|preventDefault={endHandler}
	on:mouseup|preventDefault={endHandler}
/>
<div
	transition:scale={{ duration: 250, easing: backOut }}
	class="block-parent"
	style={stylestring}
	bind:this={blockEl}
	on:touchmove|preventDefault
	on:pointermove|preventDefault
>
	<div class="block-hits" draggable="false">
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.bottom}
			<div
				on:pointermove|preventDefault
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "b");
				}}
				class="block-hit-bottom"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->

		<div
			on:pointerdown|preventDefault={(e) => {
				hitHandler(e, "m");
			}}
			class="block-hit-top"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.left}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "l");
				}}
				class="block-hit-left"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.right}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "r");
				}}
				class="block-hit-right"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.bottom && hits.left}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "bl");
				}}
				class="block-hit-bottom-left"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.top && hits.left}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "tl");
				}}
				class="block-hit-top-left"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.bottom && hits.right}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "br");
				}}
				class="block-hit-bottom-right"
			/>
		{/if}
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		{#if hits.top && hits.right}
			<div
				on:pointerdown|preventDefault={(e) => {
					hitHandler(e, "tr");
				}}
				class="block-hit-top-right"
			/>
		{/if}
	</div>
	<div
		class="block"
		draggable="false"
		style={`box-shadow: 5px 5px 0px ${tag.color}`}
	>
		{#if block.block_type == "text"}
			<BlockTextContent
				on:requestHeightIncrease={increaseHeightFromContent}
				on:updateTextContent
				{block}
			/>
		{:else if block.block_type == "image"}
			<BlockImageContent {block} />
		{:else if block.block_type == "link"}
			<BlockLinkContent {block} />
		{/if}
	</div>
</div>

{#if useBlockPreview}
	<div class="block-preview" style={previewStyle} />
{/if}

