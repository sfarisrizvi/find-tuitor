'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Send, User, MessageSquare } from 'lucide-react';

export default function TutorMessages() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [clientProfiles, setClientProfiles] = useState({}); // id -> name
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
        // Fetch conversations
        const { data: convs, error } = await supabase
          .from('conversations')
          .select('id, client_id, tutor_id, created_at')
          .or(`client_id.eq.${u.id},tutor_id.eq.${u.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch client names & admin names
        const clientIds = convs.map(c => c.client_id === u.id ? c.tutor_id : c.client_id);
        const nameMap = {};

        if (clientIds.length > 0) {
          // Fetch from client_profiles
          const { data: clients } = await supabase
            .from('client_profiles')
            .select('id, full_name')
            .in('id', clientIds);
          clients?.forEach(c => {
            nameMap[c.id] = c.full_name || 'Unnamed Client';
          });
        }

        // Standard support labels
        nameMap[u.id] = 'You';

        setClientProfiles(nameMap);
        setConversations(convs || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setMessages(data);
      }
    };
    fetchMessages();

    // Subscribe to new messages
    const supabase = createClient();
    const channel = supabase
      .channel(`room_${selectedConv.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${selectedConv.id}` 
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConv]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user) return;

    setSending(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          content: newMessage
        });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '40px' }}><p>Loading messages...</p></div>;
  }

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <h2>Messages</h2>
      
      {conversations.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--steel)' }}>
          <p>No messages yet. When parents contact you or you receive a support message from the admin, it will appear here.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 'var(--spacing-md)', minHeight: '500px', backgroundColor: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--rounded-lg)', overflow: 'hidden' }}>
          
          {/* Sidebar */}
          <div style={{ borderRight: '1px solid var(--hairline)', overflowY: 'auto' }}>
            {conversations.map(conv => {
              const otherPartyId = conv.client_id === user.id ? conv.tutor_id : conv.client_id;
              const name = clientProfiles[otherPartyId] || 'Support Admin';
              const isSelected = selectedConv?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--hairline-soft)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--brand-green-soft)' : 'transparent',
                    fontWeight: isSelected ? 600 : 400
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} style={{ color: 'var(--steel)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--ink)' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--steel)' }}>
                        {name === 'Support Admin' ? 'System Notification' : 'Client Chat'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat pane */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {selectedConv ? (
              <>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hairline)', backgroundColor: 'var(--surface)' }}>
                  <span style={{ fontWeight: 600 }}>
                    {clientProfiles[selectedConv.client_id === user.id ? selectedConv.tutor_id : selectedConv.client_id] || 'Support Admin'}
                  </span>
                </div>

                {/* Messages Box */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--surface)', maxHeight: '350px' }}>
                  {messages.map(msg => {
                    const isSelf = msg.sender_id === user.id;
                    const senderName = isSelf ? 'You' : (clientProfiles[msg.sender_id] || 'Support Admin');
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          backgroundColor: isSelf ? 'var(--brand-green-soft)' : (senderName === 'Support Admin' ? 'var(--brand-teal-deep)' : 'var(--canvas)'),
                          color: (senderName === 'Support Admin' && !isSelf) ? 'var(--on-dark)' : 'var(--ink)',
                          padding: '10px 14px',
                          borderRadius: 'var(--rounded-md)',
                          maxWidth: '70%',
                          border: isSelf ? 'none' : '1px solid var(--hairline)'
                        }}
                      >
                        <div style={{ fontSize: '11px', color: (senderName === 'Support Admin' && !isSelf) ? 'var(--brand-green)' : 'var(--steel)', fontWeight: 600, marginBottom: '2px' }}>
                          {senderName}
                        </div>
                        <div style={{ fontSize: '13px' }}>{msg.content}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Input area */}
                <form onSubmit={handleSend} style={{ display: 'flex', padding: '16px', borderTop: '1px solid var(--hairline)', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    style={{
                      flex: 1,
                      height: '40px',
                      padding: '8px 16px',
                      border: '1px solid var(--hairline-strong)',
                      borderRadius: 'var(--rounded-md)',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                  />
                  <Button type="submit" variant="primary" disabled={sending} style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    <Send size={16} />
                  </Button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--steel)' }}>
                <MessageSquare size={36} style={{ color: 'var(--muted)', marginBottom: '8px' }} />
                <p>Select a conversation to start chatting.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
