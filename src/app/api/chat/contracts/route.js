import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { sendNotification } from '../../../../lib/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    // 0. Cryptographic Session Authentication
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: A valid session is required.' },
        { status: 401 }
      );
    }

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
      revision_feedback
    } = body;

    // ----------------------------------------------------
    // ACTION 1: CREATE CONTRACT / OFFER
    // ----------------------------------------------------
    if (action === 'create_contract') {
      if (!conversation_id || !tutor_id || !client_id || !terms || !amount) {
        return NextResponse.json({ error: 'Missing required contract fields.' }, { status: 400 });
      }

      // Impersonation Prevention: User must match creator identity
      if (creator_role === 'tutor' && tutor_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Tutor ID must match your authenticated user ID.' }, { status: 403 });
      }
      if (creator_role === 'client' && client_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Client ID must match your authenticated user ID.' }, { status: 403 });
      }

      // Verify caller is a verified participant of this conversation
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select('id, client_id, tutor_id')
        .eq('id', conversation_id)
        .maybeSingle();

      if (convErr || !conv || (conv.client_id !== user.id && conv.tutor_id !== user.id)) {
        return NextResponse.json({ error: 'Forbidden: You are not a participant in this conversation.' }, { status: 403 });
      }

      // If client creates the contract/offer, ensure they have sufficient credits to lock into escrow
      if (creator_role === 'client') {
        const { data: lockCheck, error: lockCheckErr } = await supabase.rpc('lock_contract_escrow', {
          p_client_id: user.id,
          p_contract_id: conversation_id,
          p_amount: Number(amount)
        });

        if (lockCheckErr || (lockCheck && !lockCheck.success)) {
          return NextResponse.json({
            error: lockCheck?.error || `Insufficient credits. You need ${amount} credits to fund this contract in escrow. Please top up your wallet via bank deposit.`
          }, { status: 400 });
        }
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
          sender_id: user.id,
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
      if (!contract_id || !revision_feedback) {
        return NextResponse.json({ error: 'Missing contract revision details.' }, { status: 400 });
      }

      // Verify contract exists and caller is an active participant
      const { data: contractToRevise, error: fetchRevErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .single();

      if (fetchRevErr || !contractToRevise) {
        return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
      }

      if (contractToRevise.client_id !== user.id && contractToRevise.tutor_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden: You are not a party to this contract.' }, { status: 403 });
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
      if (!contract_id) {
        return NextResponse.json({ error: 'Missing contract ID for approval.' }, { status: 400 });
      }

      // Fetch contract details first
      const { data: contractToApprove, error: fetchErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .single();

      if (fetchErr || !contractToApprove) {
        return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
      }

      // Caller must strictly be tutor or client of this contract
      if (user.id !== contractToApprove.tutor_id && user.id !== contractToApprove.client_id) {
        return NextResponse.json({ error: 'Forbidden: You are not authorized to approve this contract.' }, { status: 403 });
      }

      // If Tutor is accepting (deduct 10% platform fee in credits)
      if (user.id === contractToApprove.tutor_id) {
        const { data: feeRes, error: feeErr } = await supabase.rpc('tutor_accept_contract_fee', {
          p_tutor_id: contractToApprove.tutor_id,
          p_contract_id: contract_id,
          p_amount: Number(contractToApprove.amount)
        });

        if (feeErr || (feeRes && !feeRes.success)) {
          return NextResponse.json({
            error: feeRes?.error || `Insufficient credits. You need 10% (${Math.round(contractToApprove.amount * 0.10)} credits) to accept this contract. Please buy credits via bank transfer.`
          }, { status: 400 });
        }
      }

      // If Client is accepting a tutor-initiated contract (lock 100% into escrow)
      if (user.id === contractToApprove.client_id) {
        const { data: escrowRes, error: escrowErr } = await supabase.rpc('lock_contract_escrow', {
          p_client_id: contractToApprove.client_id,
          p_contract_id: contract_id,
          p_amount: Number(contractToApprove.amount)
        });

        if (escrowErr || (escrowRes && !escrowRes.success)) {
          return NextResponse.json({
            error: escrowRes?.error || 'Insufficient credits in wallet to fund this contract in escrow.'
          }, { status: 400 });
        }
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

      // 2. Insert into escrow_contracts tracking 30-day validity
      await supabase
        .from('escrow_contracts')
        .insert({
          contract_id: contract_id,
          client_id: approvedContract.client_id,
          tutor_id: approvedContract.tutor_id,
          cycle_number: 1,
          cycle_amount_pkr: approvedContract.amount,
          tutor_fee_credits: Math.round(Number(approvedContract.amount) * 0.10),
          status: 'held',
          cycle_start_date: new Date().toISOString(),
          cycle_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          next_renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      // 3. Also insert active engagement in jobs table so both dashboards render it
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

      // 4. Dispatch Notifications
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

    // ----------------------------------------------------
    // ACTION 4: COMPLETE CONTRACT (UNLOCK REVIEWS)
    // ----------------------------------------------------
    if (action === 'complete_contract') {
      if (!contract_id) {
        return NextResponse.json({ error: 'Missing contract ID for completion.' }, { status: 400 });
      }

      // 1. Fetch contract
      const { data: contractToComplete, error: fetchErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .single();

      if (fetchErr || !contractToComplete) {
        return NextResponse.json({ error: 'Contract not found.' }, { status: 404 });
      }

      // Caller must be client or tutor of this contract
      if (contractToComplete.client_id !== user.id && contractToComplete.tutor_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized to complete this contract.' }, { status: 403 });
      }

      // 2. Call RPC to update contract status and release escrow
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('complete_contract_and_unlock_review', {
        p_contract_id: contract_id,
        p_user_id: user.id,
        p_completion_notes: body.completion_notes || null
      });

      if (rpcErr || (rpcRes && !rpcRes.success)) {
        return NextResponse.json({
          error: rpcRes?.error || 'Failed to complete contract.'
        }, { status: 400 });
      }

      // 3. Insert completion notice message into chat
      const receiverId = user.id === contractToComplete.client_id 
        ? contractToComplete.tutor_id 
        : contractToComplete.client_id;

      const completionMessage = `🏁 Tuition Contract Completed! Tuition agreement has concluded successfully. You can now leave a verified review.`;

      await supabase
        .from('messages')
        .insert({
          conversation_id: contractToComplete.conversation_id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: completionMessage,
          message_type: 'contract',
          contract_id: contract_id,
          read: false
        });

      await supabase
        .from('conversations')
        .update({
          last_message: completionMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', contractToComplete.conversation_id);

      // 4. Notify receiver
      const receiverTable = user.id === contractToComplete.client_id ? 'tutor_profiles' : 'client_profiles';
      const { data: receiverProf } = await supabase
        .from(receiverTable)
        .select('full_name, email')
        .eq('id', receiverId)
        .maybeSingle();

      if (receiverProf) {
        const notifTitle = '🏁 Contract Marked Complete';
        const notifMsg = `Your tuition contract has ended. Please share your feedback and leave a verified review.`;
        const actionUrl = user.id === contractToComplete.client_id ? '/tutor/contracts' : '/client/dashboard';

        await sendNotification({
          userId: receiverId,
          userEmail: receiverProf.email,
          userName: receiverProf.full_name || 'User',
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

      return NextResponse.json({ success: true, contract: { ...contractToComplete, status: 'completed' } });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('Error in contracts API route:', err);
    return NextResponse.json({ error: err.message || 'Server error processing contract.' }, { status: 500 });
  }
}
