declare interface EntityProfile {
  [field: string]: ProfileValue;
}

declare type ProfileValue =
  | string
  | number
  | boolean
  | null
  | ProfileValue[]
  | { [k: string]: ProfileValue };

declare interface EntityWebhookData {
  meta: {
    eventType: string;
    uuid: string;
    timestamp: number;
    accountId: string;
    actor: string;
    appSpecificAccountId: string;
  };
  entityId: string;
  primaryProfile: EntityProfile;
  languageProfiles: EntityProfile[];
  changedFields: {
    language: string;
    fieldNames: string[];
  };
  [other: string]: unknown; // TODO: remove
}
