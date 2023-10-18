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
		throw redirect(303, "../");
        
	}
	

	return {
		id: params.id,
		session,
		workspace
	};
};
