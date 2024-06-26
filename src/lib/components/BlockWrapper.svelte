<script lang="ts">
	import BlockCodeContent from "$lib/components/BlockCodeContent.svelte";
	import BlockTextContent from "$lib/components/BlockTextContent.svelte";
	import BlockImageContent from "$lib/components/BlockImageContent.svelte";
	import BlockLinkContent from "$lib/components/BlockLinkContent.svelte";

	import { scale, slide } from "svelte/transition";

	import { createEventDispatcher } from "svelte";
	import { backOut, elasticOut } from "svelte/easing";
	import { spring } from "svelte/motion";

	import { boardZoom } from "$lib/stores"

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

	export let block: Block;
	export let scrollX = 0;
	export let scrollY = 0;

	export let tag: Tag = {
		id: "",
		name: "",
		color: "",
	};
	$: console.log(tag.color, tag.name);

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
	$: actualPosition.set({ ...block.position });

	let rotate = spring(0, {
		stiffness: 0.25,
		damping: 0.75,
	});
	let originPercent = 50;
	let yOrigin = 0.5;

	let stylestring = ``;
	let actionBoundingString = ``;
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
	} * var(--blockSize) - ${scrollY}px);
left: calc(${
		$actualPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$actualPosition.x - 1
	} * var(--blockSize) - ${scrollX}px);
	transform-origin: ${originPercent}% ${yOrigin * 100}%;
	transform: rotate(${$rotate}deg);
`;
	$: actionBoundingString = `width: calc(${
		$actualPosition.w
	} * var(--blockSize) + ${$actualPosition.w - 1} * var(--blockPadding)); 
height: calc(${$actualPosition.h} * var(--blockSize) + ${
		$actualPosition.h - 1
	} * var(--blockPadding));
top: calc(${
		$actualPosition.y
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		$actualPosition.y - 1
	} * var(--blockSize) - ${scrollY}px);
left: calc(${
		$actualPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$actualPosition.x - 1
	} * var(--blockSize) - ${scrollX}px);
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
	} * var(--blockSize) - ${scrollY}px);
left: calc(${
		$previewPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$previewPosition.x - 1
	} * var(--blockSize) - ${scrollX}px);
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
	let userClickedTopBar: boolean = false;
	let blockSelected: boolean = false;
	function hitHandler(e: PointerEvent, side: any) {
		moving = side;
		pX = e.clientX;
		pY = e.clientY;
		initialPosition = { ...block.position };

		if (moving == "m") {
			userClickedTopBar = true;
		}
	}
	let rafId: number;
	function raf() {
		yOrigin = 0;
		rotate.update((n) => n / 1.4 - rotWeight);
		rafId = requestAnimationFrame(raf);
	}
	let zoomModifier = 1;
	$: zoomModifier = $boardZoom;
	function moveHandler(e: PointerEvent) {
		if (moving == "") return;
		if (userClickedTopBar) {
			originPercent =
				((e.clientX - blockEl.getBoundingClientRect().x) /
					blockEl.getBoundingClientRect().width) *
				100;

			rotWeight = (originPercent / 100 - 0.5) * 6;
			yOrigin = 0;
			raf();
			useBlockPreview = true;
			userClickedTopBar = false;
		}
		let dX = pX - e.clientX
		let dY = pY - e.clientY
		dX /= zoomModifier
		dY /= zoomModifier
		if (moving.includes("m")) {
			rotate.update((n) => n + e.movementX * 0.1);
			block.position.x = initialPosition.x - (dX) / 60;
			block.position.y = initialPosition.y - (dY) / 60;
		}
		if (moving.includes("b")) {
			block.position.h = Math.max(
				initialPosition.h + Math.round(-(dY) / 60),
				1
			);
		}
		if (moving.includes("t")) {
			block.position.h = Math.max(
				initialPosition.h + Math.round((dY) / 60),
				1
			);
			if (initialPosition.h + Math.round((dY) / 60) >= 1) {
				block.position.h =
					initialPosition.h + Math.round((dY) / 60);
				block.position.y =
					initialPosition.y - Math.round((dY) / 60);
			}
		}
		if (moving.includes("l")) {
			if (initialPosition.w + Math.round((dX) / 60) >= 1) {
				block.position.w =
					initialPosition.w + Math.round((dX) / 60);
				block.position.x =
					initialPosition.x - Math.round((dX) / 60);
			}
		}
		if (moving.includes("r")) {
			block.position.w = Math.max(
				initialPosition.w + Math.round(-(dX) / 60),
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
	function endHandler(e: PointerEvent | MouseEvent) {
		cancelAnimationFrame(rafId);
		moving = "";
		blockSelected = false;

		block.position.x = Math.round(block.position.x);
		block.position.y = Math.round(block.position.y);
		actualPosition.set({ ...block.position });
		if (JSON.stringify(block.position) != JSON.stringify(initialPosition)) {
			dispatch("positionChange", { id: block.id, position: block.position });
		}
		rotate.set(0);
		if (userClickedTopBar) {
			userClickedTopBar = false;
			blockSelected = true;
			rotate.set(1);
		}
		initialPosition = block.position;
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
	on:pointermove={moveHandler}
	on:pointerup|preventDefault={endHandler}
	on:mouseup|preventDefault={endHandler}
/>
<div class="block-action-bounding" style={actionBoundingString}>
	{#if blockSelected}
		<div transition:scale={{ duration: 250, easing: backOut }} class="block-action-bar block-action-bar-top">action bar :)</div>
		<div transition:scale={{ duration: 250, easing: backOut, delay: 50 }} class="block-action-bar block-action-bar-bottom">
			action bar bottom :)
		</div>
	{/if}
</div>
<div
	transition:scale={{ duration: 250, easing: backOut }}
	class="block-parent"
	style={stylestring}
	bind:this={blockEl}
	on:touchmove
	on:pointermove
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
		class={`block ${blockSelected ? "selected" : ""}`}
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
		{:else if block.block_type == "code"}
			<BlockCodeContent {block} />
		{/if}
	</div>
</div>

{#if useBlockPreview}
	<div class="block-preview" style={previewStyle} />
{/if}
