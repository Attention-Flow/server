export interface GoogleInfo {
  id: string;

  emails: { value: string; verified: boolean }[];

  displayName: string;

  name: { familyName: string; givenName: string };

  photos: { value: string }[];
}
