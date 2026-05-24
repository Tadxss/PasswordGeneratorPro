import React, { useState, useCallback, useMemo } from 'react';
import {
  Copy, RefreshCw, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Eye, EyeOff, Check, Zap, Lock, Code, Heart, Download, History, Trash2, ChevronDown
} from 'lucide-react';

// Log-scale helpers: maps 0-100 slider ↔ 4-128 length (powers of 2 evenly spaced)
const sliderToLength = (s) => Math.round(4 * Math.pow(32, s / 100));
const lengthToSlider = (l) => Math.round(100 * Math.log(l / 4) / Math.log(32));

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  uppercaseClean: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  lowercaseClean: 'abcdefghjkmnpqrstuvwxyz',
  numbers: '0123456789',
  numbersClean: '23456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  });
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bulkPasswords, setBulkPasswords] = useState([]);
  const [bulkCopied, setBulkCopied] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const buildCharset = useCallback((opts) => {
    let charset = '';
    if (opts.uppercase) charset += opts.excludeAmbiguous ? CHAR_SETS.uppercaseClean : CHAR_SETS.uppercase;
    if (opts.lowercase) charset += opts.excludeAmbiguous ? CHAR_SETS.lowercaseClean : CHAR_SETS.lowercase;
    if (opts.numbers) charset += opts.excludeAmbiguous ? CHAR_SETS.numbersClean : CHAR_SETS.numbers;
    if (opts.symbols) charset += CHAR_SETS.symbols;
    return charset;
  }, []);

  const generateOne = useCallback((len, opts) => {
    const charset = buildCharset(opts);
    if (!charset) return '';

    const array = new Uint32Array(len);
    crypto.getRandomValues(array);

    const required = [];
    if (opts.uppercase) {
      const src = opts.excludeAmbiguous ? CHAR_SETS.uppercaseClean : CHAR_SETS.uppercase;
      const idx = crypto.getRandomValues(new Uint32Array(1))[0] % src.length;
      required.push(src[idx]);
    }
    if (opts.lowercase) {
      const src = opts.excludeAmbiguous ? CHAR_SETS.lowercaseClean : CHAR_SETS.lowercase;
      const idx = crypto.getRandomValues(new Uint32Array(1))[0] % src.length;
      required.push(src[idx]);
    }
    if (opts.numbers) {
      const src = opts.excludeAmbiguous ? CHAR_SETS.numbersClean : CHAR_SETS.numbers;
      const idx = crypto.getRandomValues(new Uint32Array(1))[0] % src.length;
      required.push(src[idx]);
    }
    if (opts.symbols) {
      const idx = crypto.getRandomValues(new Uint32Array(1))[0] % CHAR_SETS.symbols.length;
      required.push(CHAR_SETS.symbols[idx]);
    }

    const remaining = Array.from(array).map(n => charset[n % charset.length]);
    const combined = [...required, ...remaining].slice(0, len);

    const shuffleArray = new Uint32Array(combined.length);
    crypto.getRandomValues(shuffleArray);
    for (let i = combined.length - 1; i > 0; i--) {
      const j = shuffleArray[i] % (i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }, [buildCharset]);

  const getStrength = useMemo(() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (password.length >= 20) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 3) return { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500', bars: 1, Icon: ShieldX };
    if (score <= 5) return { label: 'Fair', color: 'text-orange-400', bg: 'bg-orange-500', bars: 2, Icon: ShieldAlert };
    if (score <= 7) return { label: 'Strong', color: 'text-yellow-400', bg: 'bg-yellow-500', bars: 3, Icon: Shield };
    return { label: 'Very Strong', color: 'text-emerald-400', bg: 'bg-emerald-500', bars: 4, Icon: ShieldCheck };
  }, [password]);

  const handleGenerate = useCallback(() => {
    const hasCharType = options.uppercase || options.lowercase || options.numbers || options.symbols;
    if (!hasCharType) return;

    if (quantity === 1) {
      const pwd = generateOne(length, options);
      setPassword(pwd);
      setCopied(false);
      setBulkPasswords([]);
      setHistory(prev => {
        const entry = { password: pwd, timestamp: new Date().toLocaleTimeString(), length };
        return [entry, ...prev].slice(0, 50);
      });
    } else {
      const passwords = Array.from({ length: quantity }, () => generateOne(length, options));
      setBulkPasswords(passwords);
      setPassword('');
      const ts = new Date().toLocaleTimeString();
      setHistory(prev => {
        const entries = passwords.map(pwd => ({ password: pwd, timestamp: ts, length }));
        return [...entries, ...prev].slice(0, 50);
      });
    }
  }, [length, options, quantity, generateOne]);

  const handleCopy = useCallback(async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleBulkCopy = useCallback(async (text, index) => {
    await navigator.clipboard.writeText(text);
    setBulkCopied(index);
    setTimeout(() => setBulkCopied(null), 2000);
  }, []);

  const handleBulkDownload = useCallback(() => {
    const content = bulkPasswords.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bulkPasswords]);

  const toggleOption = useCallback((key) => {
    const active = Object.entries(options).filter(([k, v]) => ['uppercase', 'lowercase', 'numbers', 'symbols'].includes(k) && v);
    if (active.length === 1 && active[0][0] === key) return;
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }, [options]);

  const { entropyBits, charsetSize } = useMemo(() => {
    const charset = buildCharset(options);
    if (!charset || !length) return { entropyBits: 0, charsetSize: 0 };
    return { entropyBits: Math.floor(length * Math.log2(charset.length)), charsetSize: charset.length };
  }, [options, length, buildCharset]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-7 h-7 text-purple-400" />
            <div className="text-left">
              <h1 className="text-xl font-bold text-white leading-tight">Password Generator Pro</h1>
              <p className="text-xs text-slate-400">Cryptographically secure passwords</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showHistory ? 'bg-purple-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Password Display */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-400">Generated Password</span>
            {getStrength && (
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${getStrength.color}`}>
                <getStrength.Icon className="w-4 h-4" />
                {getStrength.label}
              </div>
            )}
          </div>

          <div className="relative bg-slate-900 rounded-xl px-4 py-4 mb-4 border border-slate-700 min-h-[64px] flex items-center">
            {password ? (
              <span className={`font-mono text-lg break-all text-left flex-1 ${showPassword ? 'text-white' : 'blur-sm select-none'}`}>
                {password}
              </span>
            ) : (
              <span className="text-slate-500 text-sm italic flex-1 text-left">
                {bulkPasswords.length > 0 ? `${bulkPasswords.length} passwords generated — see below` : 'Click "Generate" to create a password'}
              </span>
            )}
            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
              {password && (
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={() => handleCopy(password)}
                disabled={!password}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Strength Bars */}
          {getStrength && (
            <div className="flex gap-1.5 mb-4">
              {[1, 2, 3, 4].map(bar => (
                <div
                  key={bar}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${bar <= getStrength.bars ? getStrength.bg : 'bg-slate-700'}`}
                />
              ))}
            </div>
          )}

          {/* Entropy */}
          {entropyBits > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Entropy: <span className="text-slate-300 font-medium">{entropyBits} bits</span></span>
              <span>Charset size: <span className="text-slate-300 font-medium">{charsetSize} chars</span></span>
              <span>Length: <span className="text-slate-300 font-medium">{length}</span></span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 space-y-6">

          {/* Length Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-200">Password Length</label>
              <span className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-lg">{length}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={lengthToSlider(length)}
              onChange={e => setLength(sliderToLength(Number(e.target.value)))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-purple-500"
              style={{ background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${lengthToSlider(length)}%, #334155 ${lengthToSlider(length)}%, #334155 100%)` }}
            />
            <div className="relative mt-1 h-4">
              {[8, 16, 32, 64].map(val => (
                <span key={val} className="absolute text-xs text-slate-500 -translate-x-1/2" style={{ left: `${lengthToSlider(val)}%` }}>{val}</span>
              ))}
              <span className="absolute right-0 text-xs text-slate-500">128</span>
            </div>
          </div>

          {/* Quick length presets */}
          <div className="flex gap-2 flex-wrap">
            {[8, 16, 32, 64, 128].map(l => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${length === l ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Advanced Toggle */}
          <div className={`rounded-xl border border-slate-600 overflow-hidden transition-all`}>
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              <span>Advanced Options</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 pt-4 space-y-5 border-t border-slate-600">
                {/* Character Options */}
                <div>
                  <label className="text-sm font-semibold text-slate-200 block mb-3">Character Types</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'uppercase', label: 'Uppercase', example: 'A-Z' },
                      { key: 'lowercase', label: 'Lowercase', example: 'a-z' },
                      { key: 'numbers',   label: 'Numbers',   example: '0-9' },
                      { key: 'symbols',   label: 'Symbols',   example: '!@#$' },
                    ].map(({ key, label, example }) => (
                      <button
                        key={key}
                        onClick={() => toggleOption(key)}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all font-medium text-sm ${
                          options[key]
                            ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-500 hover:border-slate-500'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="font-mono text-xs opacity-70">{example}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Options */}
                <div>
                  <label className="text-sm font-semibold text-slate-200 block mb-3">Extra Options</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setOptions(prev => ({ ...prev, excludeAmbiguous: !prev.excludeAmbiguous }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        options.excludeAmbiguous
                          ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-500 hover:border-slate-500'
                      }`}
                    >
                      <Check className={`w-4 h-4 ${options.excludeAmbiguous ? 'opacity-100' : 'opacity-0'}`} />
                      Exclude Ambiguous (0, O, l, 1, I)
                    </button>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-semibold text-slate-200 block mb-2">Quantity</label>
                  <div className="flex items-center gap-2">
                    {[1, 5, 10, 20, 50].map(q => (
                      <button
                        key={q}
                        onClick={() => setQuantity(q)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${quantity === q ? 'bg-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-3 py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-purple-900/40"
          >
            <RefreshCw className="w-5 h-5" />
            Generate {quantity > 1 ? `${quantity} Passwords` : 'Password'}
          </button>
        </div>

        {/* Bulk Output */}
        {bulkPasswords.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{bulkPasswords.length} Generated Passwords</h2>
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {bulkPasswords.map((pwd, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-700">
                  <span className="font-mono text-sm text-slate-200 break-all text-left flex-1">{pwd}</span>
                  <button
                    onClick={() => handleBulkCopy(pwd, i)}
                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bulkCopied === i ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {bulkCopied === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {bulkCopied === i ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Password History</h2>
              <button
                onClick={() => setHistory([])}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg text-sm font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No passwords generated yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {history.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-slate-900 rounded-xl px-4 py-3 border border-slate-700">
                    <div className="flex-1 text-left overflow-hidden">
                      <span className="font-mono text-sm text-slate-200 block truncate">{entry.password}</span>
                      <span className="text-xs text-slate-500">{entry.timestamp} · {entry.length} chars</span>
                    </div>
                    <button
                      onClick={() => { setPassword(entry.password); setBulkPasswords([]); setShowHistory(false); }}
                      className="flex-shrink-0 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-all"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-300">
            <div>
              <h3 className="font-semibold text-slate-200 mb-2">Cryptographically Secure</h3>
              <p className="text-sm text-slate-400">Uses the browser built-in crypto.getRandomValues() API — the same standard used by security professionals. Never Math.random().</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-2">100% Client-Side</h3>
              <p className="text-sm text-slate-400">All passwords are generated in your browser. Nothing is sent to any server. Your passwords never leave your device.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 mb-2">Guaranteed Complexity</h3>
              <p className="text-sm text-slate-400">At least one character from each selected category is always included, then the result is shuffled using Fisher-Yates for uniform randomness.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Code className="w-5 h-5 text-purple-400" />
                <span className="text-lg font-semibold text-slate-200">Developed by</span>
              </div>
              <p className="text-xl font-bold text-purple-400 mb-2">Daryl John Tadeo</p>
              <p className="text-slate-400 text-sm">Full Stack Developer & UI/UX Enthusiast</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-pink-400" />
                <span className="text-lg font-semibold text-slate-200">Built with</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">React</span>
                <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">JavaScript</span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">Tailwind CSS</span>
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">Lucide Icons</span>
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">Vite</span>
                <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">Netlify</span>
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">Google Analytics</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-2 mb-3">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-lg font-semibold text-slate-200">Made with Passion</span>
              </div>
              <p className="text-slate-400 text-sm mb-2">
                © {new Date().getFullYear()} Daryl John Tadeo
              </p>
              <p className="text-slate-500 text-xs">
                Secure password generation made simple
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-slate-400 text-sm">
                Cryptographically secure password generator using Web Crypto API
              </div>
              <div className="text-slate-500 text-xs">
                100% client-side · No data stored · No server communication
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PasswordGenerator;
