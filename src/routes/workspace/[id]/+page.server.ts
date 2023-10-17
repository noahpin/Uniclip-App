import { fail, redirect } from "@sveltejs/kit";

export const load = async ({ locals: { supabase, getSession }, params }) => {
	const session = await getSession();

	if (!session) {
		throw redirect(303, "../");
	}
	const { data: workspace } = await supabase
		.from("workspaces")
		.select()
		.eq("id", params.id)
		.single();
	if (workspace) {
		console.log("suces");
	} else {
		console.log("no");
	}
	const { data: blocks } = await supabase
		.from("blocks")
		.select()
		.eq("workspace_id", params.id);
	const { data: tags } = await supabase
		.from("tags")
		.select()
		.eq("workspace_id", params.id);

	return {
		id: params.id,
		session,
		blocks,
		workspace,
        tags
	};
};
