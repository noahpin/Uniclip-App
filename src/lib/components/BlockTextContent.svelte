<script lang="ts">
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();
	export let block: Block;
	let element: HTMLTextAreaElement;
	function handleKeyPress() {

        dispatch("updateTextContent", {
            id: block.id,
            content: element.value,
        });
	}
</script>

<textarea bind:this={element} contenteditable="true" on:input={handleKeyPress}>{block.content}</textarea>
