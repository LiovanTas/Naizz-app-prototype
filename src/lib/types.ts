// Shared domain types for Naizz.

export type FeedPost = {
  id: string;
  userId: string;
  caption: string;
  audioPath: string;
  audioUrl: string;
  imageUrl: string | null;
  avatarUrl: string | null;
  durationSeconds: number;
  playCount: number;
  createdAt: string;
  username: string;
  displayName: string;
  likeCount: number;
  likedByMe: boolean;
};

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

export type Connection = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isFollowing: boolean;
};

export type FullProfile = Profile & {
  followers: number;
  following: number;
  voices: number;
  isFollowing: boolean;
  isMe: boolean;
};

export type SuggestedUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
};

export type Reply = {
  id: string;
  postId: string;
  userId: string;
  audioUrl: string;
  durationSeconds: number;
  createdAt: string;
  username: string;
  displayName: string;
};

export type ConversationSummary = {
  id: string;
  isGroup: boolean;
  title: string | null;
  otherUserId: string;
  otherUsername: string;
  otherDisplayName: string;
  lastMessage: string;
  lastKind: 'text' | 'voice';
  lastDuration: number;
  lastSenderIsMe: boolean;
  lastAt: string;
  unread: number;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: 'text' | 'voice';
  body: string | null;
  audioUrl: string | null;
  durationSeconds: number;
  createdAt: string;
};

export type AppNotification = {
  id: string;
  type: 'like' | 'follow' | 'reply';
  actorId: string;
  actorUsername: string;
  actorDisplayName: string;
  postId: string | null;
  createdAt: string;
  read: boolean;
};

export type RoomSummary = {
  id: string;
  hostId: string;
  title: string;
  isLive: boolean;
  createdAt: string;
  hostUsername: string;
  hostDisplayName: string;
  listeners: number;
};

export type RoomMember = {
  userId: string;
  role: 'host' | 'speaker' | 'listener';
  muted: boolean;
  username: string;
  displayName: string;
};
