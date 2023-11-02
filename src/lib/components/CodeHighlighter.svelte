<script lang="ts">
    import panda from "highlight.js/styles/panda-syntax-light.css"
	import hljs from "highlight.js/lib/common";
	export let code: string;
	$: highlighted = hljs.highlightAuto(code).value;
</script>
<pre>
<code>{@html highlighted}
</code>
</pre>
<svelte:head>
    {@html panda}
</svelte:head>
<style>
	pre {
		margin: 0;
	}
	code {
		padding: 0;
	}
</style>
