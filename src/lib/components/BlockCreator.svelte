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

	export let scrollX = 0;
	export let scrollY = 0;

	const dispatch = createEventDispatcher();

	interface Position {
		x: number;
		y: number;
		w: number;
		h: number;
	}
	let cursorPosition = spring(
		{ w: 0, h: 0, x: 0, y: 0 },

		{
			stiffness: 0.25,
			damping: 0.75,
		}
	);
	let click = false;
    let capturing = false;
	function clickHandler(e: MouseEvent) {
        // @ts-ignore
        if(e.target.id != "main-blocks") return;
		click = true;
		startMouseX = e.clientX + scrollX;
		startMouseY = e.clientY + scrollY;
	}
	let w = 0;
	let h = 0;
	let x = 0;
	let y = 0;
	let startMouseX = 0;
	let startMouseY = 0;
    let mouseX = 0;
    let mouseY = 0
	function moveHandler(e: MouseEvent) {
		mouseX = e.clientX + scrollX;
		mouseY = e.clientY + scrollY;
		if (!click) {
			x = 54 / 60 + mouseX / 60;
			y = 54 / 60 + mouseY / 60;
		} else if (click && !capturing){
			w = mouseX / 60 - x + 1 + 6 / 60;
			h = mouseY / 60 - y + 1 + 6 / 60;
			if (mouseX < startMouseX) {
				x = mouseX / 60 + 54 / 60;
				w = (startMouseX - mouseX) / 60;
			}
			if (mouseY < startMouseY) {
				y = mouseY / 60 + 54 / 60;
				h = (startMouseY - mouseY) / 60;
			}
		}
		cursorPosition.set({
			w: w,
			h: h,
			x: x,
			y: y,
		});
	}
	function endHandler() {
		if (click) {
            capturing = true;
			w = Math.round(w);
			h = Math.round(h);
			x = Math.round(x);
			y = Math.round(y);
            if(w == 0 || h == 0) {
                click = false; 
                capturing = false;
                w = 0; h = 0; x = mouseX; y = mouseY;
                cursorPosition.set({
                    w: w,
                    h: h,
                    x: x,
                    y: y,
                });
                return;
            }

			cursorPosition.set({
				w: w,
				h: h,
				x: x,
				y: y,
			});

            dispatch("createBlock", {
                position: {
                    w: w,
                    h: h,
                    x: x,
                    y: y,
                },
            });
            setTimeout(() => {
                click = false; 
                capturing = false;
                w = 0; h = 0; x = mouseX; y = mouseY;
                cursorPosition.set({
                    w: w,
                    h: h,
                    x: x,
                    y: y,
                });
            }, 500);
		}
	}

	$: previewStyle = `width: calc(${$cursorPosition.w} * var(--blockSize) + ${
		$cursorPosition.w - 1
	} * var(--blockPadding)); 
height: calc(${$cursorPosition.h} * var(--blockSize) + ${
		$cursorPosition.h - 1
	} * var(--blockPadding));
top: calc(${
		$cursorPosition.y
	} * var(--blockPadding) -  (var(--blockPadding)/2) + ${
		$cursorPosition.y - 1
	} * var(--blockSize) - ${scrollY}px);
left: calc(${
		$cursorPosition.x
	} * var(--blockPadding) - (var(--blockPadding)/2) + ${
		$cursorPosition.x - 1
	} * var(--blockSize) - ${scrollX}px);
`;
</script>

<svelte:window
	on:mousemove={moveHandler}
	on:mousedown={clickHandler}
	on:mouseup|preventDefault={endHandler}
/>

<div class="block-creator-cursor-box" style={previewStyle} />
