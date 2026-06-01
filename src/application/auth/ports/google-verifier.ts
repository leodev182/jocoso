export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | null;
}

export interface IGoogleVerifier {
  verify(idToken: string): Promise<GoogleProfile>;
}

export const GOOGLE_VERIFIER = Symbol('IGoogleVerifier');
