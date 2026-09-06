import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, lang = 'en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const sarvamKey = process.env.SARVAM_API_KEY;
    const googleKey = process.env.GOOGLE_CLOUD_TTS_KEY;

    // 1. Try Sarvam AI Bulbul v3 API first
    if (sarvamKey) {
      try {
        const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'api-subscription-key': sarvamKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: [text],
            target_language_code: lang === 'hi' ? 'hi-IN' : 'en-IN',
            speaker: 'bulbul:v3',
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v3',
          }),
        });

        if (sarvamRes.ok) {
          const sarvamData = await sarvamRes.json();
          if (sarvamData.audios && sarvamData.audios[0]) {
            const base64Audio = sarvamData.audios[0];
            const audioBuffer = Buffer.from(base64Audio, 'base64');
            return new NextResponse(audioBuffer, {
              headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length.toString(),
              },
            });
          }
        }
      } catch (err) {
        console.warn('Sarvam AI TTS call failed, falling back to Google Cloud TTS', err);
      }
    }

    // 2. Try Google Cloud TTS Chirp3-HD / Neural2 fallback
    if (googleKey) {
      try {
        const googleRes = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: {
                languageCode: lang === 'hi' ? 'hi-IN' : 'en-IN',
                name: lang === 'hi' ? 'hi-IN-Neural2-A' : 'en-IN-Neural2-A',
              },
              audioConfig: { audioEncoding: 'MP3' },
            }),
          }
        );

        if (googleRes.ok) {
          const googleData = await googleRes.json();
          if (googleData.audioContent) {
            const audioBuffer = Buffer.from(googleData.audioContent, 'base64');
            return new NextResponse(audioBuffer, {
              headers: {
                'Content-Type': 'audio/mp3',
                'Content-Length': audioBuffer.length.toString(),
              },
            });
          }
        }
      } catch (err) {
        console.warn('Google Cloud TTS call failed', err);
      }
    }

    // Fallback: Return empty so client falls back to native Web Speech API
    return NextResponse.json({ fallback: true }, { status: 200 });
  } catch (error: any) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
