import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VoiceInterfaceProps {
  onVoiceMessage: (message: string) => void;
  ttsEnabled: boolean;
  onTTSToggle: () => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  isPushToTalk: boolean;
  setIsPushToTalk: (pushToTalk: boolean) => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onVoiceMessage,
  ttsEnabled,
  onTTSToggle,
  isRecording,
  setIsRecording,
  isPushToTalk,
  setIsPushToTalk,
}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingTimeoutRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Simulate voice recognition
  const startRecording = async () => {
    setIsRecording(true);
    setIsProcessing(false);
    
    // Simulate audio level changes during recording
    const levelInterval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    // Auto-stop after 30 seconds or on silence
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
      clearInterval(levelInterval);
    }, 30000);

    // Store interval for cleanup
    (recordingTimeoutRef.current as any).levelInterval = levelInterval;
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    setAudioLevel(0);
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      if ((recordingTimeoutRef.current as any).levelInterval) {
        clearInterval((recordingTimeoutRef.current as any).levelInterval);
      }
    }

    // Simulate voice processing
    setTimeout(() => {
      const mockTranscriptions = [
        'मेरी गेहूं की फसल में पीले पत्ते दिख रहे हैं',
        'कल बारिश होगी या नहीं',
        'खाद कब डालना चाहिए',
        'नई सरकारी योजना के बारे में बताइए',
        'मिट्टी टेस्ट कैसे कराएं',
      ];
      
      const randomMessage = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      onVoiceMessage(randomMessage);
      setIsProcessing(false);
    }, 2000);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Push-to-talk functionality
  useEffect(() => {
    if (!isPushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording) {
        e.preventDefault();
        startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isRecording]);

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex items-center space-x-3">
        {/* Record Button */}
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={toggleRecording}
          disabled={isProcessing}
          className="h-12 w-12 rounded-full transition-bounce"
        >
          {isProcessing ? (
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          ) : isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        {/* TTS Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTTSToggle}
          className="h-12 w-12 rounded-full transition-bounce"
        >
          {ttsEnabled ? (
            <Volume2 className="h-5 w-5 text-success" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        {/* Push-to-talk Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPushToTalk(!isPushToTalk)}
          className="h-12 px-4 rounded-full transition-bounce"
        >
          <Radio className={`h-4 w-4 mr-2 ${isPushToTalk ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm">PTT</span>
        </Button>
      </div>

      {/* Voice Status */}
      {(isRecording || isProcessing) && (
        <Card className="shadow-float animate-bounce-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isRecording ? 'bg-destructive animate-pulse' : 'bg-warning'}`} />
                <span className="text-sm font-medium">
                  {isRecording ? 'Recording...' : 'Processing...'}
                </span>
              </div>
              
              {isPushToTalk && isRecording && (
                <Badge variant="outline" className="text-xs">
                  Release SPACE to send
                </Badge>
              )}
            </div>

            {/* Voice Waveform */}
            {isRecording && (
              <div className="flex justify-center space-x-1 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                  <div
                    key={bar}
                    className="w-1 bg-primary rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.max(4, (audioLevel + Math.random() * 20) % 30)}px`,
                      animationDelay: `${bar * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Instructions */}
            <p className="text-xs text-muted-foreground text-center">
              {isPushToTalk 
                ? 'Hold SPACE to record, release to send'
                : 'Tap again to stop recording'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};