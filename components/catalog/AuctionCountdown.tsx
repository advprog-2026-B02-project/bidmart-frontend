"use client";
import { useState, useEffect, useRef } from "react";

interface Props {
  auctionEndTime: string;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculate(endTime: string): TimeLeft {
  const diff = new Date(endTime).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSec = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    expired: false,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="rounded-xl bg-[#002447] px-3 py-2 text-lg font-bold tabular-nums text-white sm:text-2xl">
        {pad(value)}
      </span>
      <span className="mt-1 text-xs text-gray-500">{label}</span>
    </div>
  );
}

function AuctionCountdownContent({ auctionEndTime, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculate(auctionEndTime)
  );
  const expiredNotifiedRef = useRef(false);

  useEffect(() => {
    const current = calculate(auctionEndTime);

    if (current.expired) {
      if (!expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true;
        onExpire?.();
      }
      return;
    }

    expiredNotifiedRef.current = false;

    let cancelled = false;

    function updateTimeLeft() {
      const next = calculate(auctionEndTime);
      if (!cancelled) {
        setTimeLeft(next);
        if (next.expired) {
          clearInterval(intervalId);
          if (!expiredNotifiedRef.current) {
            expiredNotifiedRef.current = true;
            onExpire?.();
          }
        }
      }
    }

    const intervalId = setInterval(updateTimeLeft, 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [auctionEndTime, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="rounded-2xl bg-gray-100 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-gray-500">🔒 Lelang telah berakhir</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#f6f4ef] p-4">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
        ⏱ Sisa Waktu Lelang
      </p>
      <div className="flex items-start justify-center gap-2">
        <TimeUnit value={timeLeft.days} label="Hari" />
        <span className="mt-2 text-xl font-bold text-[#002447]">:</span>
        <TimeUnit value={timeLeft.hours} label="Jam" />
        <span className="mt-2 text-xl font-bold text-[#002447]">:</span>
        <TimeUnit value={timeLeft.minutes} label="Menit" />
        <span className="mt-2 text-xl font-bold text-[#002447]">:</span>
        <TimeUnit value={timeLeft.seconds} label="Detik" />
      </div>
    </div>
  );
}

export default function AuctionCountdown(props: Props) {
  return <AuctionCountdownContent key={props.auctionEndTime} {...props} />;
}
