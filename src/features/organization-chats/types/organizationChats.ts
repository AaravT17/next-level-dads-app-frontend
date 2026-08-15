import type { OrganizationStatus } from '@/features/organizations/types/organizations'

export interface MessageSubject {
  type?: string;
  id?: string;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_avatar_url: string | null;
  content: string;
  subject: MessageSubject | null;
  edited_at: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface ChatListItem {
  id: string;
  organization_id: string;
  organization_name: string;
  organization_status: OrganizationStatus;
  updated_at: string;
  last_message: Message | null;
}

export interface SendMessageRequest {
  content: string;
  subject?: MessageSubject | null;
}

export interface OrganizationChat {
  id: string;
  organization_id: string;
  organization_name: string;
  updated_at: string;
}