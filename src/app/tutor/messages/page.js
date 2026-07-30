'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Send, User, MessageSquare, Plus, AlertCircle, FileText, File, Reply, X, Image as ImageIcon, ChevronDown, GraduationCap, Check, CheckCheck, ShieldCheck } from 'lucide-react';
import { inspectMessageSafety } from '../../../lib/chatSecurity';
import { VoiceNoteRecorder, AttachmentUploader, CustomAudioPlayer } from '../../../components/chat/MediaUploads';
import { TutorContractModal } from '../../../components/chat/TutorContractModal';
import { ContractCard } from '../../../components/chat/ContractCard';

function TutorMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetClientId = searchParams.get('clientId');

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contractsMap, setContractsMap] = useState({});
  const [clientProfiles, setClientProfiles] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDetailsCard, setShowDetailsCard] = useState(false);

  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          .select('id, client_id, tutor_id, initiated_by, created_at, last_message, last_message_at')
          .eq('tutor_id', u.id)
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        let activeConvs = convs || [];

        if (targetClientId) {
          const existing = activeConvs.find(c => c.client_id === targetClientId);
          if (existing) setSelectedConv(existing);
        }

        // Fetch current user's profile avatar
        const { data: myTutorProf } = await supabase
          .from('tutor_profiles')
          .select('avatar_url')
          .eq('id', u.id)
          .maybeSingle();

        const { data: myClientProf } = await supabase
          .from('client_profiles')
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

        const myAvatar = resolveAvatarUrl(myTutorProf?.avatar_url || myClientProf?.avatar_url);

        const participantIds = activeConvs.map(c => c.client_id === u.id ? c.tutor_id : c.client_id);
        const nameMap = {};

        if (participantIds.length > 0) {
          const { data: clients } = await supabase
            .from('client_profiles')
            .select('id, full_name, avatar_url, client_type, grade, subjects, school_college')
            .in('id', participantIds);

          const { data: allChildren } = await supabase
            .from('children')
            .select('id, client_id, name, grade, subjects, school_college')
            .in('client_id', participantIds);

          const kidsMap = {};
          allChildren?.forEach(k => {
            if (!kidsMap[k.client_id]) kidsMap[k.client_id] = [];
            kidsMap[k.client_id].push(k);
          });

          clients?.forEach(c => {
            const isStudent = c.client_type === 'student' || (!kidsMap[c.id]?.length && (c.grade || c.subjects));
            nameMap[c.id] = {
              name: (c.full_name && c.full_name.trim() !== '') ? c.full_name : 'Client Household',
              avatar: resolveAvatarUrl(c.avatar_url),
              type: isStudent ? 'student' : (c.client_type || 'parent'),
              grade: c.grade,
              subjects: c.subjects,
              school_college: c.school_college,
              children: kidsMap[c.id] || []
            };
          });

          // Also check tutor_profiles for fallback
          const { data: altTutors } = await supabase
            .from('tutor_profiles')
            .select('id, full_name, avatar_url')
            .in('id', participantIds);

          altTutors?.forEach(t => {
            if (!nameMap[t.id] || nameMap[t.id].name === 'Client Household') {
              nameMap[t.id] = {
                name: t.full_name || 'Verified User',
                avatar: resolveAvatarUrl(t.avatar_url),
                type: 'parent',
                children: []
              };
            }
          });
        }

        nameMap[u.id] = { name: 'You', avatar: myAvatar, type: 'tutor' };
        setClientProfiles(nameMap);
        setConversations(activeConvs);
      } catch (err) {
        console.error('Error initializing tutor messages:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, targetClientId]);

  // Click outside and Esc listener for details popover
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowDetailsCard(false);
    };
    const handleClickOutside = () => setShowDetailsCard(false);

    if (showDetailsCard) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showDetailsCard]);

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
    const channelName = `tutor_room_${selectedConv.id}_${Math.random().toString(36).substring(2, 7)}`;
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
        receiver_id: selectedConv.client_id,
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
          last_message: messageType === 'contract' ? 'Sent a formal contract' : messageType === 'voice' ? 'Audio voice note' : finalContent.substring(0, 60),
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConv.id);

      await supabase
        .from('notifications')
        .insert({
          user_id: selectedConv.client_id,
          title: 'New Message Received',
          message: finalContent.substring(0, 70) || 'Sent a media attachment',
          type: 'message',
          priority: 'HIGH',
          action_url: '/client/messages',
          read: false
        });

      if (textOverride === null) setNewMessage('');
      setPendingAttachment(null);
      setReplyingTo(null);
    } catch (err) {
      console.error('Error sending tutor message:', err);
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

  const renderSubtext = (client) => {
    if (!client) return <span style={{ color: 'var(--steel)', fontSize: '12px' }}>Parent / Student</span>;

    if (client.children && client.children.length > 0) {
      const childNames = client.children.map(k => k.name).join(', ');
      return (
        <span style={{ color: 'var(--brand-green)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
          Child: {childNames}
        </span>
      );
    }

    if (client.type === 'student' || client.grade || client.subjects) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--brand-green)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
          <GraduationCap size={13} /> Student {client.grade ? `(${client.grade})` : '(Click for details)'}
        </span>
      );
    }

    return (
      <span style={{ color: 'var(--brand-green)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
        Parent (Click for details)
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--steel)' }}>
        Loading messages...
      </div>
    );
  }

  const activeParticipantId = selectedConv ? (selectedConv.client_id === user?.id ? selectedConv.tutor_id : selectedConv.client_id) : null;
  const activeClient = activeParticipantId ? clientProfiles[activeParticipantId] : null;
  const myProfile = user ? clientProfiles[user.id] : null;

  return (
    <div className="container" style={{ padding: '32px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '560px' }}>

        {/* Sidebar: Conversations List */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline-soft)', fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>
            Student Inquiries &amp; Messages
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--steel)', fontSize: '13px' }}>
                No student inquiries yet. When a parent or student contacts you regarding a tuition post or your profile, the chat thread will appear here.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const otherId = c.client_id === user?.id ? c.tutor_id : c.client_id;
                const client = clientProfiles[otherId] || { name: 'Client' };
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConv(c);
                      setShowDetailsCard(false);
                    }}
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
                      {client.avatar ? (
                        <img src={client.avatar} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        client.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600, color: 'var(--ink)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{client.name}</span>
                        {client.verified && (
                          <span title="Verified Profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981' }}>
                            <ShieldCheck size={14} fill="#10B981" color="#FFFFFF" />
                          </span>
                        )}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        {renderSubtext(client)}
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
          <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '24px', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--canvas)', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '16px' }}>
                  {activeClient?.avatar ? (
                    <img src={activeClient.avatar} alt={activeClient.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    activeClient?.name?.charAt(0) || 'C'
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                      {activeClient?.name || 'Client Household'}
                    </h4>
                    {activeClient?.verified && (
                      <span title="Verified Profile" style={{ display: 'inline-flex', alignItems: 'center', color: '#10B981' }}>
                        <ShieldCheck size={16} fill="#10B981" color="#FFFFFF" />
                      </span>
                    )}
                  </div>
                  
                  {/* Clickable Subtext Line */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetailsCard(!showDetailsCard);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      transition: 'background 0.15s ease'
                    }}
                    title="Click to view student/children profile details"
                  >
                    {renderSubtext(activeClient)}
                    <ChevronDown size={14} color="var(--brand-green)" />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowContractModal(true)}
                variant="primary"
                style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontSize: '13px', padding: '6px 20px', fontWeight: 700 }}
              >
                <Plus size={16} /> Create Formal Contract
              </Button>

              {/* Clickable Dropdown Details Card */}
              {showDetailsCard && activeClient && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '68px',
                    left: '24px',
                    zIndex: 99999,
                    backgroundColor: 'var(--canvas)',
                    border: '1px solid var(--hairline-strong)',
                    borderRadius: '20px',
                    padding: '18px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.2)',
                    minWidth: '300px',
                    maxWidth: '380px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={15} color="var(--brand-green)" />
                      {activeClient.type === 'student' ? 'Student Profile Details' : 'Children Information'}
                    </div>
                    <button
                      onClick={() => setShowDetailsCard(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--steel)', padding: '2px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {activeClient.type === 'student' ? (
                    <div style={{ backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '14px', border: '1px solid var(--hairline-strong)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '15px' }}>{activeClient.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '4px' }}>
                        Grade / Class: <strong>{activeClient.grade || 'N/A'}</strong> {activeClient.school_college ? `· ${activeClient.school_college}` : ''}
                      </div>
                      {activeClient.subjects && (
                        <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '6px', fontWeight: 500 }}>
                          Subjects: {Array.isArray(activeClient.subjects) ? activeClient.subjects.join(', ') : activeClient.subjects}
                        </div>
                      )}
                    </div>
                  ) : activeClient.children && activeClient.children.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeClient.children.map(kid => (
                        <div key={kid.id} style={{ backgroundColor: 'var(--surface)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--hairline-strong)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--brand-green-dark)', fontSize: '14px' }}>Child: {kid.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '3px' }}>
                            Grade: <strong>{kid.grade || 'N/A'}</strong> {kid.school_college ? `· ${kid.school_college}` : ''}
                          </div>
                          {kid.subjects && (
                            <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '5px', fontWeight: 500 }}>
                              Subjects: {Array.isArray(kid.subjects) ? kid.subjects.join(', ') : kid.subjects}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--steel)', padding: '8px 4px' }}>
                      Parent profile has not listed specific child records. General tuition inquiry applies.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Messages Feed */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--surface)' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--steel)', fontSize: '14px', maxWidth: '320px' }}>
                  No messages yet. Waiting for client to send inquiry details.
                </div>
              ) : (
                messages.map((m, index) => {
                  const isMe = m.sender_id === user.id;
                  const senderName = isMe ? 'You' : activeClient?.name || 'Client';
                  const senderAvatar = isMe ? myProfile?.avatar : activeClient?.avatar;

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
                placeholder={pendingAttachment ? "Type a message to send with attachment..." : "Type your reply..."}
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
            Select a student inquiry from the left list to view conversation.
          </Card>
        )}

      </div>

      {/* Tutor Contract Creation Modal */}
      {showContractModal && selectedConv && (
        <TutorContractModal
          clientId={selectedConv.client_id}
          tutorId={user.id}
          conversationId={selectedConv.id}
          onClose={() => setShowContractModal(false)}
          onContractCreated={(newContract) => {
            handleSendMessage('Formal tutor contract proposal created', 'contract', null, newContract.id);
            setShowContractModal(false);
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

export default function TutorMessages() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--steel)' }}>Loading chat...</div>}>
      <TutorMessagesContent />
    </Suspense>
  );
}
