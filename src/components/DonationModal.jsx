import React, { useState } from 'react';
import { X, Heart, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

// Currency metadata: symbol, label, multiplier (to convert display units to cents/smallest unit)
const CURRENCIES = [
  { code: 'eur', symbol: '€', label: 'EUR' },
  { code: 'usd', symbol: '$', label: 'USD' },
  { code: 'gbp', symbol: '£', label: 'GBP' },
  { code: 'cad', symbol: 'CA$', label: 'CAD' },
  { code: 'aud', symbol: 'A$', label: 'AUD' },
];

const PRESET_AMOUNTS = [3, 5, 10, 25];

export default function DonationModal({ onClose }) {
  const [currency, setCurrency] = useState('eur');
  const [selectedAmount, setSelectedAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cur = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const handlePreset = (amt) => {
    setIsCustom(false);
    setCustomAmount('');
    setSelectedAmount(amt);
    setError('');
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setSelectedAmount(null);
    setError('');
  };

  const getDisplayAmount = () => {
    if (isCustom) return parseFloat(customAmount) || 0;
    return selectedAmount || 0;
  };

  const handleDonate = async () => {
    setError('');
    const display = getDisplayAmount();

    if (!display || display <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }
    if (display < 1) {
      setError(`Minimum donation is 1 ${cur.label}.`);
      return;
    }
    if (display > 10000) {
      setError('Maximum donation is 10,000.');
      return;
    }

    // Convert to smallest unit (cents). JPY has no decimals but we're not listing it.
    const amountInCents = Math.round(display * 100);

    setLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, currency: cur.code }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError('Network error — please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-panel" style={{ maxWidth: '26rem' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '-0.03em' }}
            >
              Support the Project
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Keep Marxist.info independent &amp; ad-free
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition mt-0.5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Currency selector */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Currency
          </label>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c.code); setError(''); }}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                style={{
                  background: currency === c.code
                    ? 'rgba(200,30,30,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  border: currency === c.code
                    ? '1px solid rgba(200,30,30,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: currency === c.code ? '#f87171' : '#9ca3af',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset amounts */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Choose an amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const active = !isCustom && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  onClick={() => handlePreset(amt)}
                  className="py-3 rounded-xl font-bold text-sm transition"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #c81e1e 0%, #991b1b 100%)'
                      : 'rgba(255,255,255,0.05)',
                    border: active
                      ? '1px solid rgba(200,30,30,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: active ? '#fff' : '#9ca3af',
                    boxShadow: active ? '0 0 18px rgba(200,30,30,0.25)' : 'none',
                  }}
                >
                  {cur.symbol}{amt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom amount */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Or enter custom amount
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold select-none"
              style={{ pointerEvents: 'none' }}
            >
              {cur.symbol}
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={customAmount}
              onFocus={handleCustomFocus}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setError('');
              }}
              placeholder="0"
              className="w-full p-3 pl-8 rounded-xl text-white"
              style={{
                background: '#1a1a1a',
                border: isCustom
                  ? '1px solid rgba(200,30,30,0.45)'
                  : '1px solid rgba(255,255,255,0.08)',
                outline: 'none',
                fontFamily: 'inherit',
                boxShadow: isCustom ? '0 0 0 2px rgba(200,30,30,0.1)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="flex items-center gap-1.5 text-red-400 text-sm mb-4">
            <AlertTriangle size={14} />
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleDonate}
          disabled={loading}
          className="modal-btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base"
          style={{ borderRadius: '12px' }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Redirecting to Stripe…
            </>
          ) : (
            <>
              <Heart size={18} />
              Donate {getDisplayAmount() > 0
                ? `${cur.symbol}${getDisplayAmount()}`
                : ''} via Stripe
            </>
          )}
        </button>

        {/* Trust note */}
        <p className="text-center text-gray-600 text-xs mt-4 flex items-center justify-center gap-1">
          <ExternalLink size={11} />
          Secure payment via Stripe — we never store your card details
        </p>
      </div>
    </div>
  );
}
