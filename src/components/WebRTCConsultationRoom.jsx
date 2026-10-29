import React, { useState, useEffect, useRef } from 'react';
import { consultationService } from '../services/api';
import Button from './Button';
import Card from './Card';
import StatusBadge from './StatusBadge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  Stethoscope,
  RefreshCw,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function WebRTCConsultationRoom({
  appointmentId,
  userRole = 'patient', // 'patient' | 'doctor'
  onEndCall,
}) {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Call status
  const [inCall, setInCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Media state
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  // Video element refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // WebRTC refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const processedSignalsRef = useRef(new Set());
  const pollingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Chat/Notes state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // 1. Fetch Room Metadata
  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consultationService.getRoom(appointmentId);
      setRoomData(data);
    } catch (err) {
      console.error('Error fetching room:', err);
      setError(err.response?.data?.detail || 'Unable to access clinical consultation room.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchRoom();
    }
    return () => {
      cleanupCall();
    };
  }, [appointmentId]);

  // Call duration counter
  useEffect(() => {
    if (inCall) {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [inCall]);

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // 2. Initialize Media Devices
  const startLocalMedia = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('getUserMedia warning:', err);
      // Try audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = audioStream;
        setMediaError('Camera unavailable or disabled. Participating with audio-only.');
        return audioStream;
      } catch (audioErr) {
        setMediaError('Camera & microphone permissions unavailable in this browser session. You can still monitor and send clinical messages.');
        return null;
      }
    }
  };

  // 3. Setup RTCPeerConnection
  const setupPeerConnection = (stream) => {
    const iceServers = roomData?.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } else {
      // Add receive transceivers so peer can negotiate video & audio stream even if local mic/cam is busy
      try {
        pc.addTransceiver('audio', { direction: 'recvonly' });
        pc.addTransceiver('video', { direction: 'recvonly' });
      } catch (e) {
        // Fallback for browsers with legacy webrtc
      }
    }

    // Remote track handler
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setPeerConnected(true);
      }
    };

    // Local ICE candidate handler
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await consultationService.sendSignal(appointmentId, 'ice-candidate', event.candidate);
        } catch (e) {
          console.warn('Failed to send ICE candidate:', e);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setPeerConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeerConnected(false);
      }
    };

    return pc;
  };

  // 4. Polling for Remote Signals
  const startSignalPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const signals = await consultationService.getSignals(appointmentId);
        if (!Array.isArray(signals)) return;

        for (const sig of signals) {
          if (processedSignalsRef.current.has(sig.id)) continue;
          processedSignalsRef.current.add(sig.id);

          await handleIncomingSignal(sig);
        }
      } catch (err) {
        // Silently tolerate temporary polling errors
      }
    }, 1200);
  };

  // 5. Signal Handler
  const handleIncomingSignal = async (sig) => {
    const pc = pcRef.current;
    const type = sig.type;
    const data = sig.data;

    if (type === 'sdp-offer' && pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await consultationService.sendSignal(appointmentId, 'sdp-answer', answer);
      } catch (e) {
        console.warn('Error handling SDP offer:', e);
      }
    } else if (type === 'sdp-answer' && pc) {
      try {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        }
      } catch (e) {
        console.warn('Error handling SDP answer:', e);
      }
    } else if (type === 'ice-candidate' && pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    } else if (type === 'peer-ready' && pc) {
      // Peer arrived and requests negotiation
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await consultationService.sendSignal(appointmentId, 'sdp-offer', offer);
      } catch (e) {
        console.warn('Error sending SDP offer upon peer-ready:', e);
      }
    } else if (type === 'chat-message') {
      setMessages((prev) => [...prev, data]);
    } else if (type === 'leave') {
      setPeerConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'System',
          text: `${sig.senderRole === 'doctor' ? 'Clinician' : 'Patient'} has left the room.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // 6. Start / Join Call
  const handleStartCall = async () => {
    setConnecting(true);
    try {
      const stream = await startLocalMedia();
      const pc = setupPeerConnection(stream);
      startSignalPolling();

      // Announce arrival to room
      try {
        await consultationService.sendSignal(appointmentId, 'peer-ready', {
          role: userRole,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Could not post peer-ready signal:', e);
      }

      // Initiate WebRTC negotiation offer
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await consultationService.sendSignal(appointmentId, 'sdp-offer', offer);
      } catch (offerErr) {
        console.warn('Could not create SDP offer:', offerErr);
      }

      setInCall(true);
    } catch (err) {
      console.error('Error starting consultation:', err);
      setError('Failed to initiate secure WebRTC peer connection.');
    } finally {
      setConnecting(false);
    }
  };

  // 7. Cleanup & End Call
  const cleanupCall = async () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setInCall(false);
    setPeerConnected(false);
  };

  const handleEndCall = async () => {
    try {
      await consultationService.endConsultation(appointmentId);
    } catch (e) {
      console.warn('Could not post end signal:', e);
    }
    await cleanupCall();
    if (onEndCall) onEndCall();
  };

  // 8. Media Toggles
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !micActive));
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !videoActive));
      setVideoActive(!videoActive);
    }
  };

  // 9. Send In-Call Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: userRole === 'doctor' ? `Dr. ${roomData?.doctorName || 'Doctor'}` : (roomData?.patientName || 'Patient'),
      role: userRole,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    try {
      await consultationService.sendSignal(appointmentId, 'chat-message', newMsg);
    } catch (err) {
      console.warn('Failed to dispatch message signal:', err);
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center text-slate-500">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
        <p className="font-semibold text-slate-700">Connecting to Encrypted Consultation Room...</p>
        <p className="text-xs text-slate-400 mt-1">Validating clinician-patient authorization token</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-rose-50 border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
        <h3 className="font-bold text-rose-900 text-sm">Consultation Access Error</h3>
        <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchRoom} icon={RefreshCw} className="mt-4">
          Retry Access
        </Button>
      </Card>
    );
  }

  const peerDisplayName = userRole === 'patient' ? `Dr. ${roomData?.doctorName || 'Specialist'}` : (roomData?.patientName || 'Patient');
  const peerSubtitle = userRole === 'patient' ? (roomData?.specialization || 'Attending Physician') : 'Registered Patient';

  return (
    <div className="space-y-4">
      {/* Consultation Header Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {userRole === 'doctor' ? <Stethoscope className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">{peerDisplayName}</h3>
              <StatusBadge status={inCall ? (peerConnected ? 'Live Session' : 'Connecting') : 'Room Ready'} size="xs" />
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {peerSubtitle} • {roomData?.hospitalName || 'Mediverse Health System'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="font-mono text-[11px]">Room: #{roomData?.roomId || appointmentId}</span>
          </div>
          {inCall && (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      </div>

      {mediaError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{mediaError}</span>
        </div>
      )}

      {/* Main Grid: Video Area & Live Chat/Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Center: Video Canvas */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative border border-slate-800 shadow-lg flex items-center justify-center">
            {/* Remote Peer Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${peerConnected ? 'block' : 'hidden'}`}
            />

            {/* Waiting / Connecting Placeholder */}
            {(!inCall || !peerConnected) && (
              <div className="text-center p-6 text-white space-y-3 z-10">
                {!inCall ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-teal-400">
                      <Video className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Tele-Consultation Ready</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Click below to enter the secure room. Your camera and microphone will activate.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      icon={Video}
                      onClick={handleStartCall}
                      disabled={connecting}
                    >
                      {connecting ? 'Activating WebRTC...' : 'Join Consultation'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto" />
                    <div>
                      <h4 className="text-base font-bold text-white">Connecting Peer Stream</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Waiting for {peerDisplayName} to establish WebRTC media channel...
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Local PiP Self-View Video */}
            <div
              className={`absolute bottom-4 right-4 w-32 sm:w-44 aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-teal-500 shadow-xl z-20 ${
                inCall ? 'block' : 'hidden'
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-2 text-[9px] font-bold text-white/90 bg-slate-900/80 px-1.5 py-0.5 rounded">
                You ({userRole})
              </span>
            </div>

            {/* In-Call Controls Overlay */}
            {inCall && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-2xl z-30">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                    micActive
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-600 text-white shadow-rose-500/20 shadow-md'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                    videoActive
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-600 text-white shadow-rose-500/20 shadow-md'
                  }`}
                  title={videoActive ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all shadow-rose-600/30 shadow-md flex items-center gap-1.5 px-3"
                  title="End Consultation"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">End Call</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: In-Call Clinical Chat & Session Notes */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <Card
            title="Clinical Chat & Vitals"
            subtitle="Exchange messages, readings & notes during call"
            className="flex-1 flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col justify-between h-[360px]">
              {/* Message log */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                    <Sparkles className="w-6 h-6 text-teal-600 mb-1" />
                    <p className="font-semibold text-slate-600">Secure Session Channel</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Type below to send clinical observations, questions, or vitals.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isSelf = m.role === userRole || m.sender?.includes('You');
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border ${
                          isSelf
                            ? 'bg-teal-50/70 border-teal-200 text-teal-950 ml-4'
                            : m.sender === 'System'
                            ? 'bg-amber-50 border-amber-200 text-amber-900 mx-2 text-center'
                            : 'bg-slate-50 border-slate-200 text-slate-800 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500 font-bold">
                          <span>{m.sender}</span>
                          <span>{m.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{m.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Vitals Quick-Action Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-2 text-[10px]">
                <span className="text-slate-400 font-bold shrink-0">Quick Vitals:</span>
                {[
                  'BP: 120/80 mmHg',
                  'SpO2: 98% Normal',
                  'HR: 74 bpm Normal',
                  'Temp: 98.4°F Normal'
                ].map((vital) => (
                  <button
                    key={vital}
                    type="button"
                    onClick={() => setChatInput(vital)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
                  >
                    {vital}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type vital or note..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:border-teal-500 focus:outline-hidden"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

