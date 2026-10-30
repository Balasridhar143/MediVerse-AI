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
  Activity,
  Play,
  Wifi,
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
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState({
    connectionState: 'idle',
    iceConnectionState: 'idle',
    signalingState: 'idle',
    audioTracks: 0,
    videoTracks: 0,
  });

  // Media state
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [mediaError, setMediaError] = useState(null);

  // Video element refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // WebRTC & Session refs
  const sessionIdRef = useRef(`sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`);
  const callStartTimeRef = useRef(Date.now() - 60000); // 1-minute window
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const processedSignalsRef = useRef(new Set());
  const bufferedSignalsRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);
  const iceCandidateQueueRef = useRef([]);

  // Polite peer convention (W3C Perfect Negotiation):
  // Patient is polite (yields on collision/glare); Doctor is impolite (drives offer negotiation).
  const isPolite = userRole === 'patient';

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

  // Synchronize local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [inCall]);

  // Synchronize remote stream tracks to remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current && remoteStreamRef.current.getTracks().length > 0) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {});
      }
    }
  }, [peerConnected, inCall]);

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
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Video getUserMedia notice:', err);
      // Try audio-only if video fails
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        localStreamRef.current = audioStream;
        setMediaError('Camera unavailable or disabled. Participating with audio-only.');
        return audioStream;
      } catch (audioErr) {
        setMediaError('Camera & microphone permissions unavailable in this browser session. You can still monitor and send clinical messages.');
        return null;
      }
    }
  };

  // Flush buffered ICE candidates once remote description is set
  const flushQueuedIceCandidates = async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;

    const queue = [...iceCandidateQueueRef.current];
    iceCandidateQueueRef.current = [];

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('[WebRTC] Error adding queued ICE candidate:', err);
      }
    }
  };

  // 3. Setup RTCPeerConnection
  const setupPeerConnection = (stream) => {
    const iceServers = roomData?.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ];

    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10,
    });
    pcRef.current = pc;

    // Attach local tracks if available
    if (stream && stream.getTracks().length > 0) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // Ensure transceivers for both audio and video exist so negotiation includes both streams
    try {
      const transceivers = pc.getTransceivers();
      const hasAudio = transceivers.some((t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio');
      if (!hasAudio) {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      }
      const hasVideo = transceivers.some((t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video');
      if (!hasVideo) {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      }
    } catch (e) {
      console.warn('[WebRTC] Transceiver setup note:', e);
    }

    // Setup W3C Perfect Negotiation offer handler
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        await consultationService.sendSignal(
          appointmentId,
          'sdp-offer',
          pc.localDescription,
          sessionIdRef.current
        );
      } catch (err) {
        console.error('[WebRTC] Negotiation error:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    // Remote track handler: add incoming track to remote MediaStream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track arrived:', event.track.kind);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      const updateTrackCounts = () => {
        if (remoteStreamRef.current) {
          setDiagnostics((prev) => ({
            ...prev,
            audioTracks: remoteStreamRef.current.getAudioTracks().length,
            videoTracks: remoteStreamRef.current.getVideoTracks().length,
          }));
        }
      };

      event.track.onunmute = () => {
        console.log('[WebRTC] Remote track unmuted:', event.track.kind);
        if (remoteVideoRef.current && remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.play().catch((playErr) => {
            console.warn('[WebRTC] Autoplay deferred:', playErr);
            setAutoplayBlocked(true);
          });
        }
        updateTrackCounts();
      };

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch((playErr) => {
          console.warn('[WebRTC] Autoplay deferred:', playErr);
          setAutoplayBlocked(true);
        });
      }
      setPeerConnected(true);
      updateTrackCounts();
    };

    // Local ICE candidate handler
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await consultationService.sendSignal(
            appointmentId,
            'ice-candidate',
            event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
            sessionIdRef.current
          );
        } catch (e) {
          console.warn('[WebRTC] Failed to send ICE candidate:', e);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setDiagnostics((prev) => ({ ...prev, connectionState: pc.connectionState }));
      if (pc.connectionState === 'connected') {
        setPeerConnected(true);
        setAutoplayBlocked(false);
      } else if (pc.connectionState === 'disconnected') {
        setPeerConnected(false);
      } else if (pc.connectionState === 'failed') {
        setPeerConnected(false);
        try {
          if (pc.restartIce) pc.restartIce();
        } catch (e) {}
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      setDiagnostics((prev) => ({ ...prev, iceConnectionState: pc.iceConnectionState }));
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setPeerConnected(true);
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        if (!remoteStreamRef.current || remoteStreamRef.current.getTracks().length === 0) {
          setPeerConnected(false);
        }
      }
    };

    pc.onsignalingstatechange = () => {
      setDiagnostics((prev) => ({ ...prev, signalingState: pc.signalingState }));
    };

    // Drain any buffered signals that arrived before RTCPeerConnection initialization
    setTimeout(() => {
      drainBufferedSignals(pc);
    }, 50);

    return pc;
  };

  // Drain queued signals that arrived prior to PC initialization
  const drainBufferedSignals = async (pcInstance) => {
    const pc = pcInstance || pcRef.current;
    if (!pc) return;
    const queue = [...bufferedSignalsRef.current];
    bufferedSignalsRef.current = [];
    for (const sig of queue) {
      await handleIncomingSignal(sig, pc);
    }
  };

  // Manual Autoplay Unlock
  const handleManualPlayRemote = async () => {
    if (remoteVideoRef.current) {
      try {
        await remoteVideoRef.current.play();
        setAutoplayBlocked(false);
      } catch (err) {
        console.warn('Manual play failed:', err);
      }
    }
  };

  // Manual ICE Restart
  const handleRestartIce = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      makingOfferRef.current = true;
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      await consultationService.sendSignal(
        appointmentId,
        'sdp-offer',
        pc.localDescription,
        sessionIdRef.current
      );
    } catch (e) {
      console.warn('ICE restart error:', e);
    } finally {
      makingOfferRef.current = false;
    }
  };

  // 4. Polling for Remote Signals
  const startSignalPolling = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const signals = await consultationService.getSignals(
          appointmentId,
          '',
          sessionIdRef.current
        );
        if (!Array.isArray(signals)) return;

        // Process signals in deterministic order:
        // peer-ready -> sdp-offer -> sdp-answer -> ice-candidate -> others
        const typePriority = {
          'peer-ready': 1,
          'sdp-offer': 2,
          'sdp-answer': 3,
          'ice-candidate': 4,
          'chat-message': 5,
          'leave': 6,
        };

        const sortedSignals = [...signals].sort((a, b) => {
          const pA = typePriority[a.type] || 99;
          const pB = typePriority[b.type] || 99;
          return pA - pB;
        });

        for (const sig of sortedSignals) {
          if (processedSignalsRef.current.has(sig.id)) continue;
          processedSignalsRef.current.add(sig.id);

          await handleIncomingSignal(sig);
        }
      } catch (err) {
        // Silently tolerate temporary polling errors
      }
    }, 1000);
  };

  // 5. Signal Handler (Perfect Negotiation Pattern)
  const handleIncomingSignal = async (sig, customPc) => {
    const pc = customPc || pcRef.current;
    const type = sig.type;
    const data = sig.data;

    if (!pc && type !== 'chat-message') {
      bufferedSignalsRef.current.push(sig);
      return;
    }

    if (type === 'sdp-offer' && pc) {
      try {
        const readyForOffer =
          !makingOfferRef.current &&
          (pc.signalingState === 'stable' || isSettingRemoteAnswerPendingRef.current);
        const offerCollision = !readyForOffer;

        ignoreOfferRef.current = !isPolite && offerCollision;
        if (ignoreOfferRef.current) {
          console.log('[WebRTC] Offer collision detected: impolite peer ignoring offer');
          return;
        }

        if (offerCollision) {
          console.log('[WebRTC] Offer collision detected: polite peer rolling back');
          await pc.setLocalDescription({ type: 'rollback' });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data));
        await flushQueuedIceCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await consultationService.sendSignal(
          appointmentId,
          'sdp-answer',
          pc.localDescription,
          sessionIdRef.current
        );
      } catch (e) {
        console.error('[WebRTC] Error handling SDP offer:', e);
      }
    } else if (type === 'sdp-answer' && pc) {
      try {
        if (pc.signalingState === 'have-local-offer') {
          isSettingRemoteAnswerPendingRef.current = true;
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          isSettingRemoteAnswerPendingRef.current = false;
          await flushQueuedIceCandidates();
        } else {
          console.log('[WebRTC] Answer ignored because signalingState is', pc.signalingState);
        }
      } catch (e) {
        isSettingRemoteAnswerPendingRef.current = false;
        console.error('[WebRTC] Error handling SDP answer:', e);
      }
    } else if (type === 'ice-candidate' && pc) {
      try {
        if (!data || (!data.candidate && !data.sdpMid && data.sdpMLineIndex === undefined)) return;
        const candidate = new RTCIceCandidate(data);
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(candidate);
        } else {
          iceCandidateQueueRef.current.push(candidate);
        }
      } catch (e) {
        if (!ignoreOfferRef.current) {
          console.warn('[WebRTC] Error adding ICE candidate:', e);
        }
      }
    } else if (type === 'peer-ready' && pc) {
      console.log('[WebRTC] Remote peer arrived:', sig.senderRole);
      // Impolite peer (Doctor) initiates negotiation if in stable state
      if (!isPolite && pc.signalingState === 'stable') {
        try {
          makingOfferRef.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await consultationService.sendSignal(
            appointmentId,
            'sdp-offer',
            pc.localDescription,
            sessionIdRef.current
          );
        } catch (e) {
          console.error('[WebRTC] Error sending SDP offer upon peer-ready:', e);
        } finally {
          makingOfferRef.current = false;
        }
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
        await consultationService.sendSignal(
          appointmentId,
          'peer-ready',
          {
            role: userRole,
            sessionId: sessionIdRef.current,
            timestamp: new Date().toISOString(),
          },
          sessionIdRef.current
        );
      } catch (e) {
        console.warn('[WebRTC] Could not post peer-ready signal:', e);
      }

      // Impolite peer (Doctor) initiates offer upon start
      if (!isPolite) {
        try {
          makingOfferRef.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await consultationService.sendSignal(
            appointmentId,
            'sdp-offer',
            pc.localDescription,
            sessionIdRef.current
          );
        } catch (offerErr) {
          console.warn('[WebRTC] Could not create initial SDP offer:', offerErr);
        } finally {
          makingOfferRef.current = false;
        }
      }

      setInCall(true);
    } catch (err) {
      console.error('[WebRTC] Error starting consultation:', err);
      setError('Failed to initiate secure WebRTC peer connection.');
    } finally {
      setConnecting(false);
    }
  };

  // 7. Cleanup & End Call
  const cleanupCall = () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = new MediaStream();
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    bufferedSignalsRef.current = [];
    makingOfferRef.current = false;
    ignoreOfferRef.current = false;
    isSettingRemoteAnswerPendingRef.current = false;

    setInCall(false);
    setPeerConnected(false);
    setAutoplayBlocked(false);
    setDiagnostics({
      connectionState: 'idle',
      iceConnectionState: 'idle',
      signalingState: 'idle',
      audioTracks: 0,
      videoTracks: 0,
    });
  };

  const handleEndCall = async () => {
    try {
      await consultationService.endConsultation(appointmentId);
    } catch (e) {
      console.warn('Could not post end signal:', e);
    }
    cleanupCall();
    if (onEndCall) onEndCall();
  };

  // 8. Media Toggles
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newActive = !micActive;
      audioTracks.forEach((t) => (t.enabled = newActive));
      setMicActive(newActive);
    }
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newActive = !videoActive;
        videoTracks.forEach((t) => (t.enabled = newActive));
        setVideoActive(newActive);
      } else if (!videoActive) {
        // Camera was not acquired during initial getUserMedia; try acquiring now
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          });
          const [newVideoTrack] = videoStream.getVideoTracks();
          if (newVideoTrack) {
            localStreamRef.current.addTrack(newVideoTrack);
            if (pcRef.current) {
              pcRef.current.addTrack(newVideoTrack, localStreamRef.current);
            }
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
            setVideoActive(true);
            setMediaError(null);
          }
        } catch (camErr) {
          console.warn('[WebRTC] Could not activate camera track:', camErr);
        }
      }
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
      await consultationService.sendSignal(
        appointmentId,
        'chat-message',
        newMsg,
        sessionIdRef.current
      );
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

      {/* WebRTC Diagnostics & Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <Wifi className="w-3 h-3 text-teal-600" /> Signaling: Active
          </span>
          {inCall && (
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
              ICE: <b className="text-teal-700">{diagnostics.iceConnectionState}</b> | Peer: <b className="text-teal-700">{diagnostics.connectionState}</b>
            </span>
          )}
        </div>
        {inCall && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] font-medium text-teal-700 hover:text-teal-800 underline cursor-pointer flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              {showDiagnostics ? 'Hide Diagnostics' : 'Diagnostics & ICE Controls'}
            </button>
          </div>
        )}
      </div>

      {/* Expanded Diagnostics Card */}
      {showDiagnostics && inCall && (
        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-teal-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Real-time WebRTC Peer Telemetry
            </span>
            <button
              type="button"
              onClick={handleRestartIce}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[11px] font-sans font-semibold cursor-pointer transition-colors shadow-xs"
            >
              Force Restart ICE
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>Peer State: <span className="text-teal-300 font-bold">{diagnostics.connectionState}</span></div>
            <div>ICE Connection: <span className="text-teal-300 font-bold">{diagnostics.iceConnectionState}</span></div>
            <div>Signaling State: <span className="text-teal-300 font-bold">{diagnostics.signalingState}</span></div>
            <div>Remote Media: <span className="text-teal-300 font-bold">Audio:{diagnostics.audioTracks} / Video:{diagnostics.videoTracks}</span></div>
          </div>
        </div>
      )}

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
              onLoadedMetadata={() => remoteVideoRef.current?.play().catch(() => setAutoplayBlocked(true))}
              className={`w-full h-full object-cover ${peerConnected ? 'block' : 'hidden'}`}
            />

            {/* Autoplay deferred interaction recovery */}
            {autoplayBlocked && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-25 p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-white font-bold text-sm">Remote Clinical Stream Active</p>
                <p className="text-xs text-slate-300 max-w-xs mt-1 mb-3">
                  Browser audio/video autoplay policy requires manual interaction to initiate stream playback.
                </p>
                <button
                  type="button"
                  onClick={handleManualPlayRemote}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  <Play className="w-4 h-4 fill-white" /> Click to Unmute & Play Video
                </button>
              </div>
            )}

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
                onLoadedMetadata={() => localVideoRef.current?.play().catch(() => {})}
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

