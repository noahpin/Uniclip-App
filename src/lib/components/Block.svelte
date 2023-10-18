<script lang="ts">
    import { quintInOut } from "svelte/easing";
	import { spring } from "svelte/motion";
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
	let tweenOptions = {
		duration: 100,
        easing: quintInOut
	};
	let actualPosition = spring({...block.position}, 
		{
			stiffness: 0.1,
			damping: 0.25
		});


	export let tag: {
		id: string;
		name: string;
		color: string;
	} = {
		id: "",
		name: "",
		color: "",
	};
	let visualSizeModifiers = {
		r: 0,
		l: 0,
		t: 0,
		b: 0,
	};
	let stylestring = ``;
	$: stylestring = `width: calc(${$actualPosition.w} * var(--blockSize) + ${ ($actualPosition.w) - 1
	} * var(--blockPadding)); 
height: calc(${$actualPosition.h} * var(--blockSize) + ${
		($actualPosition.h) - 1
	} * var(--blockPadding));
top: calc(${
		($actualPosition.y)
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		($actualPosition.y) - 1
	} * var(--blockSize));
left: calc(${
        $actualPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$actualPosition.x - 1
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
	let newPosition: Position = {
		...block.position,
	};
	let lastUpdatedPosition: { x: number; y: number; w: number; h: number } = {
		...block.position,
	};
	function hitHandler(e: PointerEvent, side: any) {
		moving = side;
		pX = e.clientX;
		pY = e.clientY;
		initialPosition = { ...block.position };
		newPosition = { ...block.position };
		lastUpdatedPosition = { ...block.position };
	}
	function moveHandler(e: PointerEvent) {
		if (moving == "") return;
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
				block.position.w = initialPosition.w + Math.round((pX - e.clientX) / 60);
				block.position.x = initialPosition.x - Math.round((pX - e.clientX) / 60);
			}
		}
		if (moving.includes("r")) {
			block.position.w = Math.max(
				initialPosition.w + Math.round((e.clientX - pX) / 60),
				1
			);
		}
		if (JSON.stringify(block.position) != JSON.stringify(lastUpdatedPosition)) {
			console.log("position changed");
			lastUpdatedPosition = { ...block.position };
            actualPosition.set({...block.position});
		}
	}
</script>

<svelte:window
	on:pointermove|preventDefault={moveHandler}
	on:pointerup|preventDefault={() => {
		moving = "";
		visualSizeModifiers = {
			r: 0,
			l: 0,
			t: 0,
			b: 0,
		};
	}}
/>
<div class="block-parent" style={stylestring}>
	<div class="block-hits" draggable="false">
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "b");
			}}
			class="block-hit-bottom"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "t");
			}}
			class="block-hit-top"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "l");
			}}
			class="block-hit-left"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "r");
			}}
			class="block-hit-right"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "bl");
			}}
			class="block-hit-bottom-left"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "tl");
			}}
			class="block-hit-top-left"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "br");
			}}
			class="block-hit-bottom-right"
		/>
		<!-- svelte-ignore a11y-pointerdown-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:pointerdown={(e) => {
				hitHandler(e, "tr");
			}}
			class="block-hit-top-right"
		/>
	</div>
	<div
		class="block"
		draggable="false"
		style={`box-shadow: 5px 5px 0px ${tag.color}`}
	>
		<slot />
	</div>
</div>

<style>
	.block {
		user-select: none;
		-webkit-user-drag: none;
	}
</style>
