import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import { api } from './api';

export { RtcSurfaceView, VideoSourceType };

export interface AgoraCallConfig {
  token: string;
  channelId: string;
  appId: string;
  uid: number;
}

class AgoraService {
  private engine: IRtcEngine | null = null;
  private _remoteUid: number | null = null;
  private onRemoteJoined: ((uid: number) => void) | null = null;
  private onRemoteLeft: (() => void) | null = null;
  private onCallEnded: (() => void) | null = null;

  async fetchCallConfig(sessionId: string): Promise<AgoraCallConfig> {
    const { data } = await api.get('/calling/token', { params: { sessionId } });
    return data as AgoraCallConfig;
  }

  async init(config: AgoraCallConfig, isVideo: boolean): Promise<IRtcEngine> {
    this.engine = createAgoraRtcEngine();
    this.engine.initialize({ appId: config.appId });

    this.engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
    this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

    if (isVideo) {
      this.engine.enableVideo();
    } else {
      this.engine.enableAudio();
    }

    this.engine.addListener('onUserJoined', (connection, uid) => {
      this._remoteUid = uid;
      this.onRemoteJoined?.(uid);
    });

    this.engine.addListener('onUserOffline', () => {
      this._remoteUid = null;
      this.onRemoteLeft?.();
    });

    this.engine.addListener('onLeaveChannel', () => {
      this.onCallEnded?.();
    });

    await this.engine.joinChannel(config.token, config.channelId, config.uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });

    return this.engine;
  }

  get remoteUid() { return this._remoteUid; }

  setCallbacks(callbacks: {
    onRemoteJoined?: (uid: number) => void;
    onRemoteLeft?: () => void;
    onCallEnded?: () => void;
  }) {
    this.onRemoteJoined = callbacks.onRemoteJoined ?? null;
    this.onRemoteLeft = callbacks.onRemoteLeft ?? null;
    this.onCallEnded = callbacks.onCallEnded ?? null;
  }

  muteLocalAudio(muted: boolean) {
    this.engine?.muteLocalAudioStream(muted);
  }

  muteLocalVideo(muted: boolean) {
    this.engine?.muteLocalVideoStream(muted);
  }

  async leave() {
    await this.engine?.leaveChannel();
    this.engine?.release();
    this.engine = null;
    this._remoteUid = null;
  }
}

export const agoraService = new AgoraService();
