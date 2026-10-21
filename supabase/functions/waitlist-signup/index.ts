import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { emailWrapper, confirmationEmailBody } from '../_shared/emailTemplate.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email: rawEmail, notify_invite_codes, notify_public_beta } = await req.json()

    if (!rawEmail || typeof rawEmail !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const email = rawEmail.trim().toLowerCase()

    // Insert into waitlist
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { error: dbError } = await supabase
      .from('waitlist')
      .insert({
        email,
        notify_invite_codes: notify_invite_codes ?? true,
        notify_public_beta: notify_public_beta ?? true,
      })

    if (dbError) {
      if (dbError.code === '23505') {
        // Return 200 with a flag so supabase-js surfaces it in `data` reliably.
        return new Response(
          JSON.stringify({ alreadyExists: true, error: 'This email is already on the list' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw dbError
    }

    // Send confirmation email via Resend
    if (RESEND_API_KEY) {
      const notifyItems: string[] = []
      if (notify_invite_codes !== false) notifyItems.push('<li>When invite codes become available</li>')
      if (notify_public_beta !== false) notifyItems.push('<li>When public beta launches</li>')

      const html = emailWrapper(confirmationEmailBody(notifyItems))

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Marxist.info <onboarding@resend.dev>',
          to: [email],
          subject: 'Welcome to the Marxist.info Waitlist',
          html,
        }),
      })

      if (!resendRes.ok) {
        const errBody = await resendRes.text()
        console.error('Resend API error:', resendRes.status, errBody)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Waitlist signup error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to process signup' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
