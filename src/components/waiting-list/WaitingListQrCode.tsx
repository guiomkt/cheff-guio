import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface WaitingListQrCodeProps {
  restaurantId: string | null;
}

export function WaitingListQrCode({ restaurantId }: WaitingListQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && restaurantId) {
      // In a real app, this would be a URL to your waiting list form
      // For now, we'll use a placeholder URL
      const waitingListUrl = `https://chefguio.app/waiting-list/${restaurantId}`;
      
      QRCode.toCanvas(
        canvasRef.current,
        waitingListUrl,
        {
          width: 250,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [restaurantId]);

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas id="waiting-list-qrcode" ref={canvasRef} className="border rounded-md"></canvas>
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Escaneie este QR Code para entrar na fila de espera do restaurante.
      </p>
    </div>
  );
}