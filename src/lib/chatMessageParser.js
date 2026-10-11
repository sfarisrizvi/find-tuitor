// src/lib/chatMessageParser.js
// Parses raw chat message text, extracting forwarded banners, embedded [[file:...]] attachments,
// and normalizing storage URLs through the API Gateway (/api/chat/media)

export function parseChatMessage(rawContent, existingMediaUrl = null, existingMessageType = null) {
  let content = rawContent || '';
  let isForwarded = false;
  let fileAttachment = null;

  // Check if message is tagged as forwarded (e.g. "Forwarded: ...")
  if (/^\s*Forwarded:\s*/i.test(content)) {
    isForwarded = true;
    content = content.replace(/^\s*Forwarded:\s*/i, '').trim();
  }

  // Check for [[file:URL|FILENAME|MIMETYPE]] pattern
  const fileRegex = /\[\[file:([^|\]]+)(?:\|([^|\]]+))?(?:\|([^\]]+))?\]\]/i;
  const match = content.match(fileRegex);

  if (match) {
    const rawUrl = match[1].trim();
    const rawName = match[2]?.trim() || '';
    const mime = match[3]?.trim() || '';

    // Convert raw Supabase storage URL to API Gateway URL
    let gatewayUrl = rawUrl;
    const storageMatch = rawUrl.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/([^?]+)/);
    if (storageMatch) {
      const bucket = storageMatch[1];
      const filePath = decodeURIComponent(storageMatch[2]);
      const filename = rawName || filePath.split('/').pop() || 'attachment';
      gatewayUrl = `/api/chat/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(filename)}`;
    } else if (rawUrl.startsWith('https://') && rawUrl.includes('supabase.co')) {
      gatewayUrl = `/api/chat/media?url=${encodeURIComponent(rawUrl)}&name=${encodeURIComponent(rawName || 'attachment')}`;
    }

    // Clean display filename
    let cleanName = rawName || 'Attachment';
    if (/^\d{10,14}_(.+)$/.test(cleanName)) {
      cleanName = cleanName.replace(/^\d{10,14}_/, '');
    }

    const isImage = mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(cleanName);
    const isPdf = mime.includes('pdf') || /\.pdf$/i.test(cleanName);

    fileAttachment = {
      url: gatewayUrl,
      rawUrl,
      name: cleanName,
      mime: mime || (isPdf ? 'application/pdf' : isImage ? 'image/jpeg' : 'application/octet-stream'),
      isImage,
      isPdf
    };

    // Remove the [[file:...]] token from visible content
    content = content.replace(fileRegex, '').trim();
  } else if (existingMediaUrl) {
    // Message already has media_url column populated
    let gatewayUrl = existingMediaUrl;
    const storageMatch = existingMediaUrl.match(/\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/([^?]+)/);
    if (storageMatch) {
      const bucket = storageMatch[1];
      const filePath = decodeURIComponent(storageMatch[2]);
      const filename = filePath.split('/').pop() || 'attachment';
      gatewayUrl = `/api/chat/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(filename)}`;
    } else if (existingMediaUrl.startsWith('https://') && existingMediaUrl.includes('supabase.co')) {
      gatewayUrl = `/api/chat/media?url=${encodeURIComponent(existingMediaUrl)}`;
    }

    const isImage = existingMessageType === 'image' || /\.(png|jpg|jpeg|gif|webp)$/i.test(existingMediaUrl);
    const isPdf = /\.pdf$/i.test(existingMediaUrl);
    const isVoice = existingMessageType === 'voice' || /\.webm$/i.test(existingMediaUrl);

    fileAttachment = {
      url: gatewayUrl,
      rawUrl: existingMediaUrl,
      name: existingMediaUrl.split('/').pop() || 'Attachment',
      mime: isPdf ? 'application/pdf' : isImage ? 'image/jpeg' : isVoice ? 'audio/webm' : 'application/octet-stream',
      isImage,
      isPdf,
      isVoice
    };
  }

  return {
    cleanContent: content,
    isForwarded,
    fileAttachment
  };
}
