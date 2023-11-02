<script lang="ts">
    import CodeHighlighter from "./CodeHighlighter.svelte";
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

<div class="code-wrapper">
    <CodeHighlighter code={block.content}></CodeHighlighter>
</div>
