'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Send, User, MessageSquare, Plus, AlertCircle, FileText, File, Reply, X, Image as ImageIcon, Check, CheckCheck, ExternalLink, ShieldCheck, Forward, Download, ArrowLeft } from 'lucide-react';
import { inspectMessageSafety } from '../../../lib/chatSecurity';
import { parseChatMessage } from '../../../lib/chatMessageParser';
import { VoiceNoteRecorder, AttachmentUploader, CustomAudioPlayer } from '../../../components/chat/MediaUploads';
import { ClientOfferModal } from '../../../components/chat/ClientOfferModal';
import { ContractCard } from '../../../components/chat/ContractCard';

function ClientMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetTutorId = searchParams.get('tutorId');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contractsMap, setContractsMap] = useState({});
  const [tutorProfiles, setTutorProfiles] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [insufficientCreditsModal, setInsufficientCreditsModal] = useState(false);

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (selectedConv) {
        document.body.setAttribute('data-chat-active', 'true');
      } else {
        document.body.removeAttribute('data-chat-active');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.removeAttribute('data-chat-active');
      }
    };
  }, [selectedConv]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(() => scrollToBottom(), 60);
    return () => clearTimeout(timer);
  }, [messages, selectedConv]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);

      try {
        const { data: convs, error } = await supabase
          .from('conversations')
          .select('id, client_id, tutor_id, created_at, last_message, last_message_at')
          .or(`client_id.eq.${u.id},tutor_id.eq.${u.id}`)
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        let activeConvs = convs || [];

        if (targetTutorId && targetTutorId !== u.id) {
          let existing = activeConvs.find(c => c.tutor_id === targetTutorId);
          if (!existing) {
            // Check & deduct 100 credits to initiate new chat
            const { data: deductRes, error: deductErr } = await supabase.rpc('deduct_credits', {
              p_user_id: u.id,
              p_amount: 100,
              p_type: 'chat_initiation',
              p_description: 'Initiated in-built chat with tutor (100 credits)',
              p_reference_id: targetTutorId
            });

            if (deductErr || (deductRes && !deductRes.success)) {
              setInsufficientCreditsModal(true);
            } else {
              const { data: newConv, error: createErr } = await supabase
                .from('conversations')
                .insert({
                  client_id: u.id,
                  tutor_id: targetTutorId,
                  initiated_by: u.id,
                  last_message: 'Conversation started',
                  last_message_at: new Date().toISOString()
                })
                .select()
                .single();

              if (!createErr && newConv) {
                activeConvs = [newConv, ...activeConvs];
                existing = newConv;
              }
            }
          }
          if (existing) {
            setSelectedConv(existing);
          }
        }

        // Fetch current user's profile avatar
        const { data: myClientProf } = await supabase
          .from('client_profiles')
          .select('avatar_url')
          .eq('id', u.id)
          .maybeSingle();

        const { data: myTutorProf } = await supabase
          .from('tutor_profiles')
          .select('avatar_url')
          .eq('id', u.id)
          .maybeSingle();

        const resolveAvatarUrl = (url) => {
          if (!url) return null;
          if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
          const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qlhcavfyllfcwifxbtbu.supabase.co';
          let cleanPath = url;
          if (cleanPath.startsWith('teacher-media/')) cleanPath = cleanPath.replace('teacher-media/', '');
          return `${SUPABASE_URL}/storage/v1/object/public/teacher-media/${cleanPath}`;
        };

        const myAvatar = resolveAvatarUrl(myClientProf?.avatar_url || myTutorProf?.avatar_url);

        const tutorIds = activeConvs.map(c => c.client_id === u.id ? c.tutor_id : c.client_id);
        const nameMap = {};

        if (tutorIds.length > 0) {
          const { data: tutors } = await supabase
            .from('tutor_profiles')
            .select('id, full_name, avatar_url, verified')
            .in('id', tutorIds);

          tutors?.forEach(t => {
            nameMap[t.id] = {
              name: (t.full_name && t.full_name.trim() !== '') ? t.full_name : 'Verified Tutor',
              avatar: resolveAvatarUrl(t.avatar_url),
              verified: t.verified || false
            };
          });

          // Fallback check in client_profiles for cross-role users
          const { data: clients } = await supabase
            .from('client_profiles')
            .select('id, full_name, avatar_url, verified')
            .in('id', tutorIds);

          clients?.forEach(c => {
            if (!nameMap[c.id] || nameMap[c.id].name === 'Verified Tutor') {
              nameMap[c.id] = {
                name: (c.full_name && c.full_name.trim() !== '') ? c.full_name : 'Client Household',
                avatar: resolveAvatarUrl(c.avatar_url),
                verified: c.verified || false
              };
            }
          });
        }

        nameMap[u.id] = { name: 'You', avatar: myAvatar };
        setTutorProfiles(nameMap);
        setConversations(activeConvs);
      } catch (err) {
        console.error('Error initializing client messages:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, targetTutorId]);

  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessagesAndContracts = async () => {
      const supabase = createClient();
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });

      if (!error && msgs) {
        setMessages(msgs);

        // Mark unread messages in this active conversation as read
        const hasUnread = msgs.some(m => m.receiver_id === user.id && !m.read);
        if (hasUnread) {
          await supabase
            .from('messages')
            .update({ read: true, read_status: true })
            .eq('conversation_id', selectedConv.id)
            .eq('receiver_id', user.id)
            .eq('read', false);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('messages_read'));
          }
        }

        const contractIds = msgs.filter(m => m.contract_id).map(m => m.contract_id);
        if (contractIds.length > 0) {
          const { data: contracts } = await supabase
            .from('contracts')
            .select('*')
            .in('id', contractIds);

          const cMap = {};
          contracts?.forEach(c => { cMap[c.id] = c; });
          setContractsMap(cMap);
        }
      }
    };

    fetchMessagesAndContracts();

    const supabase = createClient();
    const channelName = `client_room_${selectedConv.id}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, async (payload) => {
        const newMsg = payload.new;
        setMessages(prev => {
          if (prev.some(existing => existing.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.contract_id) {
          const { data: cData } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', newMsg.contract_id)
            .single();

          if (cData) {
            setContractsMap(prev => ({ ...prev, [cData.id]: cData }));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv]);

  const handleSendMessage = async (textOverride = null, messageTypeOverride = null, mediaUrlOverride = null, contractId = null) => {
    const rawContent = textOverride !== null ? textOverride : newMessage;
    const mediaUrl = mediaUrlOverride !== null ? mediaUrlOverride : (pendingAttachment ? pendingAttachment.url : null);
    const messageType = messageTypeOverride || (pendingAttachment ? pendingAttachment.type : (contractId ? 'contract' : 'text'));

    if (!rawContent.trim() && !mediaUrl && !contractId) return;

    setSending(true);
    try {
      const supabase = createClient();
      const activeTutorId = selectedConv.tutor_id === user.id ? selectedConv.client_id : selectedConv.tutor_id;

      let finalContent = rawContent.trim();
      let replyData = null;

      if (replyingTo) {
        replyData = {
          sender_name: replyingTo.sender_name,
          content: replyingTo.content.substring(0, 50) + (replyingTo.content.length > 50 ? '...' : '')
        };
        finalContent = `> ↩ Replying to ${replyingTo.sender_name}: "${replyData.content}"\n${finalContent}`;
      }

      const securityCheck = inspectMessageSafety(finalContent);

      const msgPayload = {
        conversation_id: selectedConv.id,
        sender_id: user.id,
        receiver_id: activeTutorId,
        content: finalContent,
        message_type: messageType,
        media_url: mediaUrl,
        contract_id: contractId,
        has_warning: securityCheck.hasWarning,
        read: false,
        read_status: false
      };

      const { data: sentMsg, error } = await supabase
        .from('messages')
        .insert(msgPayload)
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({
          last_message: messageType === 'contract' ? 'Sent a tuition offer' : messageType === 'voice' ? 'Audio voice note' : finalContent.substring(0, 60),
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConv.id);

      await supabase
        .from('notifications')
        .insert({
          user_id: activeTutorId,
          title: 'New Message Received',
          message: finalContent.substring(0, 70) || 'Sent a media attachment',
          type: 'message',
          priority: 'HIGH',
          action_url: '/tutor/messages',
          read: false
        });

      if (textOverride === null) setNewMessage('');
      setPendingAttachment(null);
      setReplyingTo(null);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleContractUpdated = (updatedContract) => {
    setContractsMap(prev => ({ ...prev, [updatedContract.id]: updatedContract }));
  };

  const parseReplyContent = (rawText) => {
    if (!rawText || !rawText.startsWith('> ↩ Replying to ')) return { replyData: null, mainContent: rawText };
    const firstLineEnd = rawText.indexOf('\n');
    if (firstLineEnd === -1) return { replyData: null, mainContent: rawText };

    const firstLine = rawText.substring(0, firstLineEnd);
    const mainContent = rawText.substring(firstLineEnd + 1);

    const match = firstLine.match(/^> ↩ Replying to (.*?): "(.*?)"$/);
    if (match) {
      return {
        replyData: { sender_name: match[1], content: match[2] },
        mainContent
      };
    }
    return { replyData: null, mainContent: rawText };
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--steel)' }}>
        Loading messages...
      </div>
    );
  }

  const activeTutor = selectedConv ? tutorProfiles[selectedConv.tutor_id === user.id ? selectedConv.client_id : selectedConv.tutor_id] : null;
  const myProfile = user ? tutorProfiles[user.id] : null;

  return (
    <div className="container messages-container-custom" style={{ padding: '32px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div className="messages-page-wrapper">

        {/* Sidebar: Conversations List */}
        <Card className={`messages-sidebar-col ${selectedConv ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline-soft)', fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>
            Messages &amp; Tutors
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--steel)', fontSize: '13px' }}>
                No active conversations. Visit a tutor profile to start chatting!
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const tutorId = c.client_id === user.id ? c.tutor_id : c.client_id;
                const tutor = tutorProfiles[tutorId] || { name: 'Verified Tutor' };
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    style={{
                      padding: '14px 18px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--brand-green)' : '4px solid transparent',
                      borderBottom: '1px solid var(--hairline-soft)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-green-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
                      {tutor.avatar ? (
                        <img src={tutor.avatar} alt={tutor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        tutor.name?.charAt(0) || 'T'
                      )}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600, color: 'var(--ink)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{tutor.name}</span>
                        {tutor.verified && (
                          <span title="Verified Profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981' }}>
                            <ShieldCheck size={14} fill="#10B981" color="#FFFFFF" />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--steel)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.last_message || 'No messages yet'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Main Chat Area */}
        {selectedConv ? (
          <Card className={`messages-chat-col ${!selectedConv ? 'mobile-hidden' : ''}`} style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <button
                  className="messages-back-btn"
                  onClick={() => setSelectedConv(null)}
                  aria-label="Back to conversations"
                  title="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '16px', flexShrink: 0 }}>
                  {activeTutor?.avatar ? (
                    <img src={activeTutor.avatar} alt={activeTutor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    activeTutor?.name?.charAt(0) || 'T'
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeTutor?.name || 'Verified Tutor'}
                    </h4>
                    {activeTutor?.verified && (
                      <span title="Verified Profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981', flexShrink: 0 }}>
                        <ShieldCheck size={16} fill="#10B981" color="#FFFFFF" />
                      </span>
                    )}
                    {selectedConv && (
                      <a
                        href={`/tutors/${selectedConv.tutor_id === user?.id ? selectedConv.client_id : selectedConv.tutor_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Tutor Profile in new tab"
                        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--brand-green)', marginLeft: '2px', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--brand-green)', fontWeight: 600 }}>Active Tuition Thread</span>
                </div>
              </div>

              <Button
                onClick={() => setShowOfferModal(true)}
                variant="primary"
                className="messages-header-action-btn"
                style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontSize: '13px', padding: '6px 20px', fontWeight: 700, flexShrink: 0 }}
              >
                <Plus size={16} />
                <span className="btn-text-desktop">Send Tuition Offer</span>
                <span className="btn-text-mobile">Offer</span>
              </Button>
            </div>

            {/* Messages Feed */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--surface)' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--steel)', fontSize: '14px', maxWidth: '320px' }}>
                  Send a message to start discussing tuition requirements and schedule.
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMe = m.sender_id === user.id;
                  const senderName = isMe ? 'You' : activeTutor?.name || 'Tutor';
                  const senderAvatar = isMe ? myProfile?.avatar : activeTutor?.avatar;

                  const { replyData, mainContent: rawReplyStrippedContent } = parseReplyContent(m.content);
                  const { cleanContent: mainText, isForwarded, fileAttachment } = parseChatMessage(rawReplyStrippedContent, m.media_url, m.message_type);

                  const securityCheck = inspectMessageSafety(mainText);
                  const hasWarning = m.has_warning || securityCheck.hasWarning;
                  const contract = m.contract_id ? contractsMap[m.contract_id] : null;

                  return (
                    <div
                      key={`${m.id || 'msg'}_${index}`}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexDirection: isMe ? 'row-reverse' : 'row'
                      }}
                    >
                      {/* User Avatar Circle */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-green-soft)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'var(--brand-green-dark)', alignSelf: 'flex-end', marginBottom: '18px' }}>
                        {senderAvatar ? (
                          <img src={senderAvatar} alt={senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          senderName.charAt(0)
                        )}
                      </div>

                      {/* Message Content & Metadata Box */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                        {/* Message Bubble Body */}
                        {m.message_type === 'contract' || m.message_type === 'offer' ? (
                          <ContractCard
                            contract={contract}
                            currentUserId={user.id}
                            onContractUpdated={handleContractUpdated}
                          />
                        ) : (
                          <div
                            style={{
                              padding: '12px 18px',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              backgroundColor: isMe ? 'var(--brand-green-dark)' : 'var(--canvas)',
                              color: isMe ? '#FFFFFF' : 'var(--ink)',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                              border: isMe ? 'none' : '1px solid var(--hairline-strong)',
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {/* Forwarded Header Indicator */}
                            {isForwarded && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontStyle: 'italic',
                                color: isMe ? 'rgba(255, 255, 255, 0.8)' : 'var(--steel)',
                                marginBottom: '6px'
                              }}>
                                <Forward size={13} style={{ transform: 'scaleX(-1)' }} />
                                <span>Forwarded</span>
                              </div>
                            )}

                            {/* Nested Reply Block */}
                            {replyData && (
                              <div style={{
                                backgroundColor: isMe ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.06)',
                                borderLeft: `3px solid ${isMe ? '#FFFFFF' : 'var(--brand-green)'}`,
                                padding: '6px 10px',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                fontSize: '12px',
                                opacity: 0.88
                              }}>
                                <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                                  Replying to {replyData.sender_name}
                                </div>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px', marginTop: '2px' }}>
                                  {replyData.content}
                                </div>
                              </div>
                            )}

                            {/* Media / File Attachment via API Gateway */}
                            {fileAttachment && (
                              fileAttachment.isVoice ? (
                                <CustomAudioPlayer src={fileAttachment.url} duration={15} />
                              ) : fileAttachment.isImage ? (
                                <div
                                  style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--hairline-strong)', cursor: 'pointer', maxWidth: '280px', marginBottom: mainText ? '8px' : '0' }}
                                  onClick={() => setPreviewImage(fileAttachment.url)}
                                >
                                  <img src={fileAttachment.url} alt={fileAttachment.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                              ) : (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 14px',
                                  borderRadius: '12px',
                                  backgroundColor: isMe ? 'rgba(255, 255, 255, 0.15)' : 'var(--surface-soft)',
                                  border: `1px solid ${isMe ? 'rgba(255, 255, 255, 0.25)' : 'var(--hairline-strong)'}`,
                                  marginBottom: mainText ? '8px' : '0',
                                  minWidth: '220px'
                                }}>
                                  <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    backgroundColor: fileAttachment.isPdf ? '#EF4444' : 'var(--brand-green)',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    flexShrink: 0
                                  }}>
                                    {fileAttachment.isPdf ? 'PDF' : <FileText size={18} />}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                      fontWeight: 600,
                                      fontSize: '13px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      color: isMe ? '#FFFFFF' : 'var(--ink)'
                                    }}>
                                      {fileAttachment.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: isMe ? 'rgba(255, 255, 255, 0.8)' : 'var(--steel)' }}>
                                      {fileAttachment.isPdf ? 'PDF Document' : 'Attachment'}
                                    </div>
                                  </div>
                                  <a
                                    href={fileAttachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={fileAttachment.name}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      backgroundColor: isMe ? '#FFFFFF' : 'var(--brand-green)',
                                      color: isMe ? 'var(--brand-green-dark)' : '#FFFFFF',
                                      textDecoration: 'none',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      flexShrink: 0
                                    }}
                                  >
                                    <Download size={13} /> View
                                  </a>
                                </div>
                              )
                            )}

                            {/* Main Text Content */}
                            {mainText && (
                              <div>{mainText}</div>
                            )}
                          </div>
                        )}

                        {/* Safety Warning Banner if contact info detected */}
                        {hasWarning && (
                          <div style={{
                            margin: '6px 0',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            backgroundColor: '#FFFBEB',
                            border: '1px solid #FCD34D',
                            color: '#92400E',
                            fontSize: '11px',
                            lineHeight: '1.4',
                            maxWidth: '380px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <AlertCircle size={14} color="#B45309" />
                              <strong>Warning:</strong>
                            </div>
                            Sharing contact information ({securityCheck.types?.join(', ') || 'Phone/Email/URL'}) in chat violates TutorOnline Terms of Service. Platform guarantees, verified tutor protections, and escrow services apply ONLY to in-app interactions.
                          </div>
                        )}

                        {/* Timestamp & Status Checks */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--steel)' }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Sent Status Icons (Single Check / Blue Double Check) */}
                          {isMe && (
                            <span title={m.read || m.read_status ? 'Read' : 'Sent'} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
                              {m.read || m.read_status ? (
                                <CheckCheck size={14} color="#3B82F6" />
                              ) : (
                                <Check size={14} color="var(--steel)" style={{ opacity: 0.7 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* External Reply Button (Center of Message Box Side) */}
                      <button
                        onClick={() => setReplyingTo({ id: m.id, content: mainText || (fileAttachment ? fileAttachment.name : (m.media_url ? 'Attachment' : 'Message')), sender_name: senderName })}
                        title="Reply to message"
                        style={{
                          background: 'var(--canvas)',
                          border: '1px solid var(--hairline-strong)',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--steel)',
                          cursor: 'pointer',
                          opacity: 0.75,
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                          alignSelf: 'center'
                        }}
                      >
                        <Reply size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Replying Banner */}
            {replyingTo && (
              <div style={{ padding: '8px 16px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--steel)' }}>
                <span>Replying to <strong>{replyingTo.sender_name}</strong>: &quot;{replyingTo.content}&quot;</span>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Pending Staged Attachment Banner */}
            {pendingAttachment && (
              <div style={{ padding: '8px 16px', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  {pendingAttachment.type === 'image' ? (
                    <img src={pendingAttachment.url} alt="Attachment" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <File size={20} color="var(--brand-green)" />
                  )}
                  <span style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Staged Attachment: {pendingAttachment.name}
                  </span>
                </div>
                <button onClick={() => setPendingAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--hairline-soft)', backgroundColor: 'var(--canvas)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* Staged File Uploader (Left) */}
              <AttachmentUploader
                onFileSelected={(stagedFile) => setPendingAttachment(stagedFile)}
              />

              {/* Text Input (Middle) */}
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={pendingAttachment ? "Type a message to send with attachment..." : "Type your message..."}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ flex: 1, borderRadius: '999px', height: '44px', paddingLeft: '16px' }}
              />

              {/* Voice Note Mic Button (Right side, icon only) */}
              <VoiceNoteRecorder
                onSendVoice={(url) => handleSendMessage('Voice note recording', 'voice', url)}
              />

              {/* Send Button (Right) */}
              <Button
                onClick={() => handleSendMessage()}
                disabled={sending || (!newMessage.trim() && !pendingAttachment)}
                variant="primary"
                style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--brand-green)', flexShrink: 0 }}
              >
                <Send size={18} color="var(--on-primary)" />
              </Button>
            </div>

          </Card>
        ) : (
          <Card className="messages-chat-col mobile-hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)', borderRadius: '24px' }}>
            Select a conversation from the left to start messaging.
          </Card>
        )}

      </div>

      {/* Client Offer Creation Modal */}
      {showOfferModal && selectedConv && (
        <ClientOfferModal
          tutorId={selectedConv.tutor_id === user.id ? selectedConv.client_id : selectedConv.tutor_id}
          clientId={user.id}
          conversationId={selectedConv.id}
          onClose={() => setShowOfferModal(false)}
          onOfferCreated={(newContract) => {
            handleSendMessage('Tuition offer created', 'contract', null, newContract.id);
            setShowOfferModal(false);
          }}
        />
      )}

      {/* Image Thumbnail Preview Modal */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <img src={previewImage} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {/* Insufficient Credits Paywall Modal */}
      {insufficientCreditsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <AlertCircle size={28} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
              100 Credits Required to Chat
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'var(--steel)', lineHeight: 1.5 }}>
              Initiating a direct chat with a tutor requires 100 credits. Your account balance is low. Please top up your wallet via bank deposit to continue.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                variant="secondary"
                style={{ flex: 1 }}
                onClick={() => setInsufficientCreditsModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                onClick={() => router.push('/client/wallet')}
              >
                Buy Credits Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientMessages() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--steel)' }}>Loading chat...</div>}>
      <ClientMessagesContent />
    </Suspense>
  );
}
