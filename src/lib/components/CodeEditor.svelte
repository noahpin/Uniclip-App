<!-- CodeEditor.svelte -->
<script lang="ts">
	import { onMount } from "svelte";
	import hljs from "highlight.js";
	import "ace-builds/webpack-resolver";
	import * as Ace from "ace-builds";

	let code: string = 'const message = "Hello, Svelte!";';

	onMount(() => {
		const editor = Ace.edit("ace-editor");
		editor.setTheme("ace/theme/monokai");
		editor.session.setMode("ace/mode/javascript");
		editor.setValue(code);
		editor.clearSelection();
		hljs.highlightBlock(editor.container);
	});

	function updateCode(newCode: string) {
		code = newCode;
		const editor = Ace.edit("ace-editor");
		editor.setValue(newCode);
		editor.clearSelection();
		hljs.highlightBlock(editor.container);
	}
</script>

<div id="ace-editor" />

<button on:click={() => updateCode('const message = "Hello, Svelte!";')}>
	Set Example Code
</button>

<style>
	#ace-editor {
		width: 100%;
		height: 300px;
	}
</style>
