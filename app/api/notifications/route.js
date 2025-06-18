// app/api/notifications/route.js

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push-sender'

export async function POST(request) {
  try {
    // 1) parse payload
    const { user_id, source_user_id, type, post_id } = await request.json()

    // 2) init Supabase admin client (service role)
    const supabase = createAdminClient()

    // 3) insert into notifications table
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        source_user_id,
        type,
        post_id
      })
      .select()        // return the inserted row
      .single()

    if (insertError) {
      console.error('🔴 insert notification error:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // 4) look up the actor's username for the push payload
    let actorUsername = null
    const { data: actor, error: actorErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', source_user_id)
      .single()

    if (actorErr) {
      console.error('⚠️ failed to fetch actor profile:', actorErr)
    } else {
      actorUsername = actor.username
    }

    // 5) fire off the FCM push in the background
    sendPush({
      user_id: notification.user_id,
      source_profile_username: actorUsername,
      type: notification.type,
      id: notification.id
    }).catch((err) => {
      console.error('⚠️ sendPush failed:', err)
    })

    // 6) respond with the notification row
    return NextResponse.json(notification)
  } catch (err) {
    console.error('🔥 unexpected error in /api/notifications:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}