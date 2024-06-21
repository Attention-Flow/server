export interface GoogleUserDTO {
  id: string; // 111730864536150163517
  displayName: string;
  name: { familyName: string; givenName: string };

  emails: { value: string; verified: boolean }[];
  photos: {
    value: string;
  }[];
  provider: 'google';
}
