'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Send, User, MessageSquare, Plus, AlertCircle, FileText, File, Lock } from 'lucide-react';
import { inspectMessageSafety } from '../../../lib/chatSecurity';
import { VoiceNoteRecorder, AttachmentUploader } from '../../../components/chat/MediaUploads';
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
  const [contractsMap, setContractsMap] = useState({}); // contract_id -> contract object
  const [clientProfiles, setClientProfiles] = useState({}); // id -> profile info
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        // Fetch conversations for tutor where client initiated
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
        } else if (activeConvs.length > 0 && !selectedConv) {
          setSelectedConv(activeConvs[0]);
        }

        // Fetch client names & avatars
        const clientIds = activeConvs.map(c => c.client_id);
        const nameMap = {};

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from('client_profiles')
            .select('id, full_name, avatar_url, client_type')
            .in('id', clientIds);
          clients?.forEach(c => {
            nameMap[c.id] = { name: c.full_name || 'Client', avatar: c.avatar_url, type: c.client_type || 'parent' };
          });
        }

        nameMap[u.id] = { name: 'You', avatar: null, type: 'tutor' };
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

  // Fetch messages and contracts when selected conversation changes
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

        // Fetch referenced contracts
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

    // Realtime channel for new messages
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
        setMessages(prev => [...prev, newMsg]);

        if (newMsg.contract_id) {
          const { data: cData } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', newMsg.contract_id)
            .maybeSingle();
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

  const handleSendMessage = async (textOverride = null, messageType = 'text', mediaUrl = null, contractId = null) => {
    const textToSend = textOverride !== null ? textOverride : newMessage;
    if ((!textToSend || !textToSend.trim()) && !mediaUrl && !contractId) return;

    setSending(true);
    try {
      const supabase = createClient();
      const securityCheck = inspectMessageSafety(textToSend);

      const { data: sentMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          receiver_id: selectedConv.client_id,
          content: textToSend.trim(),
          message_type: messageType,
          media_url: mediaUrl,
          contract_id: contractId,
          has_warning: securityCheck.hasWarning,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message timestamp
      await supabase
        .from('conversations')
        .update({
          last_message: textToSend.trim() || 'Media sent',
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConv.id);

      if (textOverride === null) setNewMessage('');
    } catch (err) {
      console.error('Error sending tutor message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleContractUpdated = (updatedContract) => {
    setContractsMap(prev => ({ ...prev, [updatedContract.id]: updatedContract }));
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--steel)' }}>
        Loading messages...
      </div>
    );
  }

  const activeClient = selectedConv ? clientProfiles[selectedConv.client_id] : null;

  return (
    <div className="container" style={{ padding: '32px 16px', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '560px' }}>

        {/* Sidebar: Conversations List */}
        <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '20px' }}>
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
                const client = clientProfiles[c.client_id] || { name: 'Parent / Student' };
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
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: isSelected ? 700 : 600, color: 'var(--ink)', marginBottom: '4px' }}>
                      {client.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--steel)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message || 'No messages yet'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Main Chat Area */}
        {selectedConv ? (
          <Card style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--hairline-strong)', borderRadius: '20px' }}>
            
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--canvas)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--brand-green-dark)' }}>
                  {activeClient?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                    {activeClient?.name || 'Parent / Student'}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--brand-green)', fontWeight: 600 }}>Inquiry Thread</span>
                </div>
              </div>

              {/* Action: Create Formal Contract */}
              <Button
                onClick={() => setShowContractModal(true)}
                variant="primary"
                style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '999px', fontSize: '13px', padding: '6px 18px', fontWeight: 700 }}
              >
                <Plus size={16} /> Create Formal Contract
              </Button>
            </div>

            {/* Messages Thread Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--surface)' }}>
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--steel)', fontSize: '14px', maxWidth: '320px' }}>
                  No messages yet. Waiting for client to send inquiry details.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  const securityCheck = inspectMessageSafety(m.content);
                  const hasWarning = m.has_warning || securityCheck.hasWarning;
                  const contract = m.contract_id ? contractsMap[m.contract_id] : null;

                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Render Contract/Offer Card */}
                      {m.message_type === 'contract' || m.message_type === 'offer' ? (
                        <ContractCard
                          contract={contract}
                          currentUserId={user.id}
                          onContractUpdated={handleContractUpdated}
                        />
                      ) : m.message_type === 'voice' ? (
                        <div style={{
                          backgroundColor: isMe ? 'var(--brand-teal-deep)' : 'var(--canvas)',
                          color: isMe ? '#fff' : 'var(--ink)',
                          border: isMe ? 'none' : '1px solid var(--hairline-strong)',
                          borderRadius: '18px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <audio src={m.media_url} controls style={{ height: '32px', maxWidth: '240px' }} />
                        </div>
                      ) : m.message_type === 'file' ? (
                        <a
                          href={m.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: isMe ? 'var(--brand-teal-deep)' : 'var(--canvas)',
                            color: isMe ? '#fff' : 'var(--ink)',
                            border: isMe ? 'none' : '1px solid var(--hairline-strong)',
                            borderRadius: '16px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none'
                          }}
                        >
                          <File size={20} />
                          <span style={{ fontSize: '13px', fontWeight: 600, textDecoration: 'underline' }}>{m.content || 'Attached Document'}</span>
                        </a>
                      ) : (
                        <div style={{
                          backgroundColor: isMe ? 'var(--brand-teal-deep)' : 'var(--canvas)',
                          color: isMe ? '#fff' : 'var(--ink)',
                          border: isMe ? 'none' : '1px solid var(--hairline-strong)',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          padding: '12px 16px',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          wordBreak: 'break-word',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                          {m.content}
                        </div>
                      )}

                      {/* Safety Warning Banner if contact info detected */}
                      {hasWarning && (
                        <div style={{
                          marginTop: '6px',
                          backgroundColor: '#FFFBEB',
                          border: '1px solid #FCD34D',
                          color: '#92400E',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '11px',
                          lineHeight: '1.4',
                          maxWidth: '380px'
                        }}>
                          {securityCheck.warningText}
                        </div>
                      )}

                      <span style={{ fontSize: '10px', color: 'var(--steel)', marginTop: '4px', padding: '0 4px' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--hairline-soft)', backgroundColor: 'var(--canvas)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AttachmentUploader onSendFile={(url, fileName) => handleSendMessage(fileName, 'file', url)} />
              <VoiceNoteRecorder onSendVoice={(url) => handleSendMessage('Voice Note', 'voice', url)} />
              
              <Input
                placeholder="Type your reply..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ flex: 1 }}
              />

              <Button
                onClick={() => handleSendMessage()}
                disabled={sending || (!newMessage.trim() && !sending)}
                variant="primary"
                style={{ backgroundColor: 'var(--brand-green)', color: 'var(--on-primary)', borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={18} />
              </Button>
            </div>

          </Card>
        ) : (
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)', border: '1px solid var(--hairline-strong)', borderRadius: '20px' }}>
            Select an inquiry thread to start chatting.
          </Card>
        )}

      </div>

      {/* Tutor Contract Modal */}
      {selectedConv && (
        <TutorContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          conversation={selectedConv}
          tutorUser={user}
          clientUser={{ id: selectedConv.client_id }}
          onContractCreated={(contract, msg) => {
            setMessages(prev => [...prev, msg]);
            setContractsMap(prev => ({ ...prev, [contract.id]: contract }));
          }}
        />
      )}

    </div>
  );
}

export default function TutorMessages() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>Loading messages...</div>}>
      <TutorMessagesContent />
    </Suspense>
  );
}
