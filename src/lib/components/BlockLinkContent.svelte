<!-- In your Svelte component -->
<script lang="ts">
	export let block: Block;

	let linkMetadata: any = null;
	let linkFavicon: string = "";

	const isValidUrl = (urlString: string) => {
		try {
			return Boolean(new URL(urlString));
		} catch (e) {
			return false;
		}
	};

	async function fetchMetadata(url: string) {
		try {
			const encodedUrl = encodeURIComponent(url); // Encode the URL
			const response = await fetch(`/api/metadata/${encodedUrl}`);
			const { metadata } = await response.json();
            console.log(metadata)

			linkMetadata = metadata; // Update the Svelte reactive variable
			//get optimal favicon; loop through all favicons and get either the one
			//with the largest size, or if theres an ico or svg.
			//see if you need to add the url to the href, if so, add it
			if (metadata.favicons.length > 0) {
				let largestSize = 0;
				let largestSizeIndex = 0;
				let icoIndex = -1;
				let svgIndex = -1;
				for (let i = 0; i < metadata.favicons.length; i++) {
					if (parseInt(metadata.favicons[i].sizes) > largestSize) {
						largestSize = parseInt(metadata.favicons[i].sizes);
						largestSizeIndex = i;
					}
					if (metadata.favicons[i].href.includes(".ico")) {
						icoIndex = i;
					}
					if (metadata.favicons[i].href.includes(".svg")) {
						svgIndex = i;
					}
				}
				if (svgIndex != -1) {
					linkFavicon = metadata.favicons[svgIndex].href;
				} else if (icoIndex != -1) {
					linkFavicon = metadata.favicons[icoIndex].href;
				} else {
					linkFavicon = metadata.favicons[largestSizeIndex].href;
				}
			}
			if (!isValidUrl(linkFavicon) && linkFavicon != "") {
				linkFavicon = new URL(url).origin + linkFavicon;
			}
		} catch (err) {
			console.log("Fetch error:", err);
		}
	}

	// Call the fetchMetadata function when the component mounts
	import { onMount } from "svelte";

	onMount(() => {
		fetchMetadata(block.content);
	});
</script>

{#if linkMetadata}
	<div class="link-block-wrapper">
		<a href={block.content} target="_blank" title={linkMetadata.title || block.content}>
			{#if linkMetadata.title}
				{#if linkFavicon}
					<img class="link-block-favicon" src={linkFavicon} />
				{/if}
				<p class="link-block-title">
					{linkMetadata.title}
				</p>
			{:else}
				<p class="link-block-title">
					{block.content}
				</p>
			{/if}
		</a>
	</div>
{/if}
