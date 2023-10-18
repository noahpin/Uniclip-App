<script lang="ts">
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();
	export let block: Block;
	let element: HTMLTextAreaElement;
	function handleKeyPress() {
		//@ts-ignore
		const trimmedText = false;

        dispatch("updateTextContent", {
            id: block.id,
            content: element.value,
        });
		

		// Check if the trimmed content exceeds the element's bounds
		if (trimmedText) {
			let computedStyle = getComputedStyle(element);
			let elementHeight = element.clientHeight;
			elementHeight -=
				parseFloat(computedStyle.paddingTop) +
				parseFloat(computedStyle.paddingBottom);
			let elementWidth = element.clientWidth;
			elementWidth -=
				parseFloat(computedStyle.paddingLeft) +
				parseFloat(computedStyle.paddingRight);
			const dummy = document.createElement("p");
			dummy.style.visibility = "hidden";
			dummy.style.position = "absolute";
			dummy.style.width = elementWidth + "px";
			dummy.style.overflowWrap = "break-word";
			dummy.innerText = trimmedText;

			document.body.appendChild(dummy);
            console.log(dummy.clientHeight, elementHeight)
			if (dummy.clientHeight + 15 > elementHeight) {
                return;
				dispatch("requestHeightIncrease", {
					id: block.id,
					height: dummy.clientHeight + 15 - elementHeight,
				});
			}

			document.body.removeChild(dummy);
		}
	}
</script>

<textarea bind:this={element} contenteditable="true" on:input={handleKeyPress}>{block.content}</textarea>
