/* Type declarations for firebase-admin subpath exports so TS resolves during build.
 * Runtime uses webpack externals. */
declare module "firebase-admin/app" {
  export function initializeApp(options?: object): unknown;
  export function getApps(): unknown[];
  export function cert(credential: object): unknown;
  export type App = unknown;
}

declare module "firebase-admin/firestore" {
  export interface DocumentReference {
    id: string;
  }
  export function getFirestore(app?: unknown): unknown;
  export function collection(fs: unknown, ...pathSegments: string[]): unknown;
  export function doc(fsOrCol: unknown, ...pathSegments: string[]): DocumentReference;
  export function getDoc(ref: unknown): Promise<{ exists: () => boolean; id: string; data: () => object }>;
  export function getDocs(ref: unknown): Promise<{
    docs: Array<{
      id: string;
      data: () => object;
      ref: { parent?: { parent?: { id?: string } } };
    }>;
    empty: boolean;
  }>;
  export function setDoc(ref: unknown, data: object): Promise<void>;
  export function updateDoc(ref: unknown, data: object): Promise<void>;
  export function deleteDoc(ref: unknown): Promise<void>;
  export function query(ref: unknown, ...constraints: unknown[]): unknown;
  export function where(field: string, op: string, value: unknown): unknown;
  export function orderBy(field: string, dir?: string): unknown;
  export function limit(n: number): unknown;
  export function collectionGroup(fs: unknown, collectionId: string): unknown;
  export function addDoc(ref: unknown, data: object): Promise<unknown>;
  export function serverTimestamp(): unknown;
  export type Timestamp = unknown;
}

declare module "firebase-admin/auth" {
  export interface Auth {
    verifyIdToken(idToken: string): Promise<{ uid: string }>;
    setCustomUserClaims(uid: string, claims: object): Promise<void>;
  }
  export function getAuth(app?: unknown): Auth;
}

declare module "firebase-admin/storage" {
  export interface Storage {
    bucket(name?: string): { file(path: string): FileRef };
  }
  export interface FileRef {
    save(data: unknown, opts?: object): Promise<void>;
    makePublic(): Promise<void>;
    delete(): Promise<void>;
    bucket: { name: string };
  }
  export function getStorage(app?: unknown): Storage;
}

declare module "firebase-admin/database" {
  export interface Database {}
  export interface Reference {}
  export function getDatabase(app?: unknown): Database;
  export function ref(db: Database, path: string): Reference;
  export function set(ref: Reference, value: unknown): Promise<void>;
  export function remove(ref: Reference): Promise<void>;
}
