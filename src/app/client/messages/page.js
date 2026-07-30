'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Send, User, MessageSquare, Plus, AlertCircle, FileText, File, Reply, X, Image as ImageIcon, Check, CheckCheck, ExternalLink, ShieldCheck } from 'lucide-react';
import { inspectMessageSafety } from '../../../lib/chatSecurity';
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

  const messagesContainerRef = useRef(null);

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
    <div className="container" style={{ padding: '32px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '560px' }}>

        {/* Sidebar: Conversations List */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px' }}>
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
          <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '16px' }}>
                  {activeTutor?.avatar ? (
                    <img src={activeTutor.avatar} alt={activeTutor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    activeTutor?.name?.charAt(0) || 'T'
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                      {activeTutor?.name || 'Verified Tutor'}
                    </h4>
                    {activeTutor?.verified && (
                      <span title="Verified Profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981' }}>
                        <ShieldCheck size={16} fill="#10B981" color="#FFFFFF" />
                      </span>
                    )}
                    {selectedConv && (
                      <a
                        href={`/tutors/${selectedConv.tutor_id === user?.id ? selectedConv.client_id : selectedConv.tutor_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View Tutor Profile in new tab"
                        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--brand-green)', marginLeft: '2px', cursor: 'pointer' }}
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
                style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontSize: '13px', padding: '6px 20px', fontWeight: 700 }}
              >
                <Plus size={16} /> Send Tuition Offer
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

                  const securityCheck = inspectMessageSafety(m.content);
                  const hasWarning = m.has_warning || securityCheck.hasWarning;
                  const contract = m.contract_id ? contractsMap[m.contract_id] : null;

                  const { replyData, mainContent } = parseReplyContent(m.content);
                  const isImage = m.message_type === 'image' || (m.media_url && /\.(png|jpg|jpeg|gif|webp)$/i.test(m.media_url));

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

                            {/* Media Attachment inside same single bubble */}
                            {m.media_url && (
                              m.message_type === 'voice' ? (
                                <CustomAudioPlayer src={m.media_url} duration={15} />
                              ) : isImage ? (
                                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--hairline-strong)', cursor: 'pointer', maxWidth: '280px', marginBottom: mainContent ? '8px' : '0' }} onClick={() => setPreviewImage(m.media_url)}>
                                  <img src={m.media_url} alt="Shared image" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                              ) : (
                                <a
                                  href={m.media_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: isMe ? 'rgba(255, 255, 255, 0.2)' : 'var(--surface)',
                                    color: 'inherit',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    marginBottom: mainContent ? '8px' : '0'
                                  }}
                                >
                                  <File size={16} /> Shared Attachment
                                </a>
                              )
                            )}

                            {/* Main Text Content */}
                            {mainContent && (
                              <div>{mainContent}</div>
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
                            <strong>⚠️ Warning:</strong> Sharing contact information ({securityCheck.types?.join(', ') || 'Phone/Email/URL'}) in chat violates TutorOnline Terms of Service. Platform guarantees, verified tutor protections, and escrow services apply ONLY to in-app interactions.
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
                        onClick={() => setReplyingTo({ id: m.id, content: mainContent || (m.media_url ? 'Attachment' : 'Message'), sender_name: senderName })}
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
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)', borderRadius: '24px' }}>
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
