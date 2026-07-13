import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './Button';
import getCroppedImg from '../../utils/cropImage';

export function ImageCropModal({ imageSrc, aspect, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      alert('Error cropping image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        position: 'relative', width: '90%', maxWidth: '600px', height: '60vh',
        backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden'
      }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      
      <div style={{ marginTop: '20px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(e.target.value)}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onCancel} style={{ backgroundColor: 'white', color: 'black' }} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
