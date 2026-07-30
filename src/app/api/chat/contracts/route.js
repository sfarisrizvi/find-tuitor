import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '../../../../lib/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      action,
      conversation_id,
      tutor_id,
      client_id,
      creator_role,
      child_ids = [],
      subjects = [],
      terms,
      payment_plan,
      amount,
      mode,
      duration_value,
      duration_unit,
      contract_id,
      user_id,
      revision_feedback
    } = body;

    // ----------------------------------------------------
    // ACTION 1: CREATE CONTRACT / OFFER
    // ----------------------------------------------------
    if (action === 'create_contract') {
      if (!conversation_id || !tutor_id || !client_id || !terms || !amount) {
        return NextResponse.json({ error: 'Missing required contract fields.' }, { status: 400 });
      }

      // 1. Insert contract record
      const { data: contract, error: contractErr } = await supabase
        .from('contracts')
        .insert({
          conversation_id,
          client_id,
          tutor_id,
          creator_role,
          child_ids,
          subjects,
          terms,
          payment_plan,
          amount,
          mode,
          duration_value,
          duration_unit,
          status: 'pending'
        })
        .select()
        .single();

      if (contractErr) throw contractErr;

      // 2. Insert chat message referencing contract
      const messageContent = creator_role === 'tutor' 
        ? `📄 Sent a Formal Tutor Contract (PKR ${amount}/${payment_plan})` 
        : `✉️ Sent a Tuition Offer (PKR ${amount}/${payment_plan})`;

      const receiverId = creator_role === 'tutor' ? client_id : tutor_id;

      const { data: chatMessage, error: msgErr } = await supabase
        .from('messages')
        .insert({
          conversation_id,
          sender_id: creator_role === 'tutor' ? tutor_id : client_id,
          receiver_id: receiverId,
          content: messageContent,
          message_type: creator_role === 'tutor' ? 'contract' : 'offer',
          contract_id: contract.id,
          read: false
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      // 3. Update conversation last message timestamp
      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation_id);

      // 4. Dispatch Notifications
      const notifTitle = creator_role === 'tutor' ? 'New Tutor Contract Received' : 'New Tuition Offer Received';
      const notifMsg = `You received a ${creator_role === 'tutor' ? 'contract' : 'tuition offer'} of PKR ${amount}/${payment_plan}. Click to review terms.`;
      const actionUrl = creator_role === 'tutor' ? '/client/messages' : '/tutor/messages';

      // Fetch receiver email
      const targetTable = creator_role === 'tutor' ? 'client_profiles' : 'tutor_profiles';
      const { data: receiverProf } = await supabase
        .from(targetTable)
        .select('full_name, email')
        .eq('id', receiverId)
        .maybeSingle();

      if (receiverProf) {
        await sendNotification({
          userId: receiverId,
          userEmail: receiverProf.email,
          userName: receiverProf.full_name || 'User',
          title: notifTitle,
          message: notifMsg,
          type: 'contract',
          priority: 'URGENT',
          actionUrl,
          templateName: 'contract_notice',
          templateData: {
            TITLE: notifTitle,
            MESSAGE: notifMsg,
            ACTION_URL: `https://tutoronline.pk${actionUrl}`
          }
        });
      }

      return NextResponse.json({ success: true, contract, message: chatMessage });
    }

    // ----------------------------------------------------
    // ACTION 2: REVISE CONTRACT
    // ----------------------------------------------------
    if (action === 'revise_contract') {
      if (!contract_id || !user_id || !revision_feedback) {
        return NextResponse.json({ error: 'Missing contract revision details.' }, { status: 400 });
      }

      const { data: updatedContract, error: updateErr } = await supabase
        .from('contracts')
        .update({
          status: 'revision_requested',
          revision_feedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract_id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      const receiverId = updatedContract.creator_role === 'tutor' ? updatedContract.tutor_id : updatedContract.client_id;
      const notifTitle = 'Contract Revision Requested';
      const notifMsg = `Changes requested: "${revision_feedback}". Please review and revise.`;
      const actionUrl = updatedContract.creator_role === 'tutor' ? '/tutor/messages' : '/client/messages';

      const targetTable = updatedContract.creator_role === 'tutor' ? 'tutor_profiles' : 'client_profiles';
      const { data: creatorProf } = await supabase
        .from(targetTable)
        .select('full_name, email')
        .eq('id', receiverId)
        .maybeSingle();

      if (creatorProf) {
        await sendNotification({
          userId: receiverId,
          userEmail: creatorProf.email,
          userName: creatorProf.full_name || 'User',
          title: notifTitle,
          message: notifMsg,
          type: 'contract',
          priority: 'HIGH',
          actionUrl,
          templateName: 'contract_notice',
          templateData: {
            TITLE: notifTitle,
            MESSAGE: notifMsg,
            ACTION_URL: `https://tutoronline.pk${actionUrl}`
          }
        });
      }

      return NextResponse.json({ success: true, contract: updatedContract });
    }

    // ----------------------------------------------------
    // ACTION 3: APPROVE CONTRACT
    // ----------------------------------------------------
    if (action === 'approve_contract') {
      if (!contract_id || !user_id) {
        return NextResponse.json({ error: 'Missing approval details.' }, { status: 400 });
      }

      // 1. Update contract to approved & active
      const { data: approvedContract, error: appErr } = await supabase
        .from('contracts')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', contract_id)
        .select()
        .single();

      if (appErr) throw appErr;

      // 2. Also insert active engagement in jobs table so both dashboards render it
      const { error: jobErr } = await supabase
        .from('jobs')
        .insert({
          client_id: approvedContract.client_id,
          child_id: approvedContract.child_ids?.[0] || null,
          title: `Active Tuition (${approvedContract.mode.replace('-', ' ')})`,
          budget_type: approvedContract.payment_plan,
          budget_amount: approvedContract.amount,
          mode: approvedContract.mode,
          duration: `${approvedContract.duration_value} ${approvedContract.duration_unit}(s)`,
          status: 'in_progress',
          description: approvedContract.terms
        });

      if (jobErr) {
        console.error('Non-critical error creating job engagement record:', jobErr);
      }

      // 3. Dispatch Notifications
      const notifTitle = '🎉 Contract Approved & Tuition Started!';
      const notifMsg = `Your tuition agreement of PKR ${approvedContract.amount}/${approvedContract.payment_plan} has been approved. Tuition is now active!`;
      
      const creatorId = approvedContract.creator_role === 'tutor' ? approvedContract.tutor_id : approvedContract.client_id;
      const creatorTable = approvedContract.creator_role === 'tutor' ? 'tutor_profiles' : 'client_profiles';

      const { data: creatorProf } = await supabase
        .from(creatorTable)
        .select('full_name, email')
        .eq('id', creatorId)
        .maybeSingle();

      if (creatorProf) {
        await sendNotification({
          userId: creatorId,
          userEmail: creatorProf.email,
          userName: creatorProf.full_name || 'User',
          title: notifTitle,
          message: notifMsg,
          type: 'contract',
          priority: 'URGENT',
          actionUrl: approvedContract.creator_role === 'tutor' ? '/tutor/contracts' : '/client/dashboard',
          templateName: 'contract_notice',
          templateData: {
            TITLE: notifTitle,
            MESSAGE: notifMsg,
            ACTION_URL: `https://tutoronline.pk`
          }
        });
      }

      return NextResponse.json({ success: true, contract: approvedContract });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in contracts API route:', err);
    return NextResponse.json({ error: err.message || 'Server error processing contract.' }, { status: 500 });
  }
}
