// Edge Function: send-push
// Disparada por um Database Webhook toda vez que uma linha é inserida em "messages".
// Ela busca a subscription de push do destinatário e manda a notificação via Web Push.
//
// Configuração necessária (Dashboard > Edge Functions > send-push > Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex: "mailto:voce@exemplo.com")
//   SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (para ler subscriptions e nomes ignorando RLS)

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@exemplo.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.record; // linha inserida em "messages"

    const { data: sub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', message.receiver_id)
      .single();

    if (!sub) {
      return new Response(JSON.stringify({ skipped: 'sem subscription para esse usuário' }), { status: 200 });
    }

    const { data: sender } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', message.sender_id)
      .single();

    // Convites de jogo (type = "convite:<gameKey>") abrem direto na tela do jogo.
    let url = '';
    if (typeof message.type === 'string' && message.type.startsWith('convite:')) {
      const gameKey = message.type.slice('convite:'.length);
      url = `#/jogos/${gameKey}`;
    }

    const notificationPayload = JSON.stringify({
      title: sender?.name ? `${sender.name} 💛` : 'Nossa Órbita',
      body: message.body,
      url
    });

    await webpush.sendNotification(sub.subscription, notificationPayload);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
