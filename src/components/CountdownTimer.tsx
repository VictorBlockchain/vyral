'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string;
  onComplete?: () => void;
}

export function CountdownTimer({ endDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate, onComplete]);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {timeLeft.days > 0 && (
        <div
          style={{
            background: 'var(--color-primary)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            textAlign: 'center',
            minWidth: '60px',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{timeLeft.days}</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>days</div>
        </div>
      )}
      <div
        style={{
          background: 'var(--color-secondary)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '60px',
        }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{timeLeft.hours}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>hours</div>
      </div>
      <div
        style={{
          background: 'var(--color-accent)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '60px',
        }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{timeLeft.minutes}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>min</div>
      </div>
      <div
        style={{
          background: '#666',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: '60px',
        }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{timeLeft.seconds}</div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>sec</div>
      </div>
    </div>
  );
}
