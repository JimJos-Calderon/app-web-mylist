import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ItemRecord {
    id: string
    titulo: string
    tipo: 'pelicula' | 'serie'
    poster_url: string | null
    user_id: string
    list_id: string
    genero?: string
    created_at: string
}

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: ItemRecord
    schema: string
}

Deno.serve(async (req: Request) => {
    try {
        const payload: WebhookPayload = await req.json()

        // Solo procesamos INSERTs en la tabla items
        if (payload.type !== 'INSERT' || payload.table !== 'items') {
            return new Response('OK', { status: 200 })
        }

        const item = payload.record

        // Cliente con service role para leer datos sin RLS
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Obtener username del autor
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', item.user_id)
            .maybeSingle()

        // Obtener nombre de la lista
        const { data: list } = await supabase
            .from('lists')
            .select('name')
            .eq('id', item.list_id)
            .maybeSingle()

        const authorName = profile?.username ?? 'Alguien'
        const listName = list?.name ?? 'una lista'
        const isMovie = item.tipo === 'pelicula'
        const emoji = isMovie ? '🎬' : '📺'
        const typeLabel = isMovie ? 'Película' : 'Serie'
        const color = isMovie ? 0xec4899 : 0xa855f7 // pink / purple

        const discordPayload = {
            embeds: [
                {
                    title: `${emoji} ${item.titulo}`,
                    description: `**${authorName}** ha añadido una nueva ${typeLabel.toLowerCase()} a **${listName}**`,
                    color,
                    fields: [
                        { name: 'Tipo', value: typeLabel, inline: true },
                        ...(item.genero ? [{ name: 'Género', value: item.genero, inline: true }] : []),
                        { name: 'Añadido por', value: `@${authorName}`, inline: true },
                        { name: 'Lista', value: listName, inline: true },
                    ],
                    ...(item.poster_url ? { thumbnail: { url: item.poster_url } } : {}),
                    footer: { text: 'MyList • Nuestra Lista ♥' },
                    timestamp: item.created_at,
                },
            ],
        }

        const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload),
        })

        if (!discordRes.ok) {
            const errorText = await discordRes.text()
            console.error('Discord error:', discordRes.status, errorText)
            return new Response('Discord error', { status: 500 })
        }

        return new Response('OK', { status: 200 })
    } catch (err) {
        console.error('Edge function error:', err)
        return new Response('Internal error', { status: 500 })
    }
})
