import { Language } from '@/types/weather';

export async function speakText(text: string, lang: Language = 'en'): Promise<void> {
  if (!text) return;

  // 1. Try server-side TTS API route (which calls Sarvam AI v3 or Google Cloud TTS)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });

    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 0) {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn('Server-side TTS failed or unavailable, falling back to Web Speech API', err);
  }

  // 2. Native Web Speech API Fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop ongoing audio

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    // Try finding an Indian accent voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        (lang === 'hi' && v.lang.includes('hi')) ||
        (lang === 'en' && (v.lang.includes('en-IN') || v.lang.includes('en-US')))
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
