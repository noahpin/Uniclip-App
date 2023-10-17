<script lang="ts">
    import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
    export let data;

    let {session, workspaces} = data;
    $: ({session, workspaces} = data);
    console.log(workspaces);
    let loading:boolean = false;
    const handleSignOut: SubmitFunction = () => {
		loading = true
		return async ({ update }) => {
			loading = false
			update()
		}
	}
</script>

<form method="post" action="?/signout" use:enhance={handleSignOut}>
    <div>
        <button class="button block" disabled={loading}>Sign Out</button>
    </div>
</form>

{#each workspaces as workspace} 
    <a href={`./workspace/${workspace.id}`}>{workspace.name}</a>
{/each}
