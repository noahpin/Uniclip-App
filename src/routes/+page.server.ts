import { fail, redirect } from '@sveltejs/kit'

export const load = async ({ locals: { supabase, getSession } }) => {
  const session = await getSession()

  if (!session) {
    throw redirect(303, '/auth')
  }else if(session) {
    throw redirect(303, '/workspaces')

  }

  const { data: profile } = await supabase
    .from('users')
    .select(`username, full_name`)
    .eq('id', session.user.id)
    .single()

  return { session, profile }
}

export const actions = {
  update: async ({ request, locals: { supabase, getSession } }) => {
    const formData = await request.formData()
    const fullName = formData.get('fullName') as string
    const username = formData.get('username') as string

    const session = await getSession()

    const { error } = await supabase.from('users').upsert({
      id: session?.user.id,
      full_name: fullName,
      username,
      updated_at: new Date(),
    })

    if (error) {
      return fail(500, {
        fullName,
        username,
      })
    }

    return {
      fullName,
      username,
    }
  },
  signout: async ({ locals: { supabase, getSession } }) => {
    const session = await getSession()
    if (session) {
      await supabase.auth.signOut()
      throw redirect(303, '/auth')
    }
  },
}
