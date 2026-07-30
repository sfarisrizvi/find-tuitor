'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

export function CustomAudioPlayer({ src, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainderSecs = Math.floor(secs % 60);
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      borderRadius: '999px',
      backgroundColor: 'var(--canvas)',
      border: '1px solid var(--hairline-strong)',
      minWidth: '220px'
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />

      <button
        onClick={togglePlay}
        type="button"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--brand-green)',
          color: 'var(--on-primary)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
      </button>

      <input
        type="range"
        min="0"
        max={audioRef.current?.duration || duration || 100}
        value={currentTime}
        onChange={handleSeek}
        style={{
          flex: 1,
          accentColor: 'var(--brand-green)',
          cursor: 'pointer',
          height: '4px'
        }}
      />

      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink)', minWidth: '35px', textAlign: 'right' }}>
        {formatTime(currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}

export function VoiceNoteRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone permission is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (!recordedBlob) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
      const filePath = `voice-notes/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, recordedBlob, {
          contentType: 'audio/webm',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      await onSendVoice(publicUrl, duration);
      setRecordedBlob(null);
      setAudioUrl(null);
    } catch (err) {
      console.error('Error uploading voice note:', err);
      alert('Failed to upload voice note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backgroundColor: 'var(--canvas)',
      border: '1px solid var(--hairline-strong)',
      borderRadius: '999px',
      padding: '4px 12px',
      color: 'var(--ink)'
    }}>
      {!recordedBlob ? (
        <>
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Square size={12} fill="#fff" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-green)',
                color: 'var(--on-primary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Mic size={15} />
            </button>
          )}
          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px', color: isRecording ? '#EF4444' : 'var(--ink)' }}>
            {isRecording ? `🔴 ${formatTime(duration)}` : 'Record'}
          </span>
          {isRecording && (
            <button
              type="button"
              onClick={() => { stopRecording(); if (onCancel) onCancel(); }}
              style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </>
      ) : (
        <>
          <CustomAudioPlayer src={audioUrl} duration={duration} />
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => { setRecordedBlob(null); setAudioUrl(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--steel)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={uploading}
              style={{
                backgroundColor: 'var(--brand-green)',
                color: 'var(--on-primary)',
                border: 'none',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {uploading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AttachmentUploader({ onSendFile }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop().toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExt);

      const fileName = `${isImage ? 'img' : 'file'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `attachments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, {
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      await onSendFile(publicUrl, file.name, isImage ? 'image' : 'file');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload attachment. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        title="Attach Document or Image"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '1px solid var(--hairline-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--ink)'
        }}
      >
        <Paperclip size={18} />
      </button>
    </div>
  );
}
