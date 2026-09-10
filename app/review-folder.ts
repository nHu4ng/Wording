export type ReviewFolderEntry<T> = {
  id: string;
  name: string;
  importedAt: string;
  rawJson: string;
  document: T;
};

const DATABASE_NAME = 'lexiwise-review-folder';
const DATABASE_VERSION = 1;
const STORE_NAME = 'imported-json';

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

function openReviewFolderDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('This browser does not support local review storage.'));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local review storage.'));
  });
}

function isReviewFolderEntry<T>(value: unknown): value is ReviewFolderEntry<T> {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<ReviewFolderEntry<T>>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.importedAt === 'string' &&
    typeof entry.rawJson === 'string' &&
    entry.document !== undefined
  );
}

export async function listReviewFolderEntries<T>() {
  const database = await openReviewFolderDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const entries = await requestResult(transaction.objectStore(STORE_NAME).getAll());
    await transactionDone(transaction);
    return entries
      .filter(isReviewFolderEntry<T>)
      .sort((left, right) => left.importedAt.localeCompare(right.importedAt));
  } finally {
    database.close();
  }
}

export async function appendReviewFolderEntries<T>(entries: ReviewFolderEntry<T>[]) {
  if (!entries.length) return;
  const database = await openReviewFolderDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    entries.forEach((entry) => store.put(entry));
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function removeReviewFolderEntry(id: string) {
  const database = await openReviewFolderDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}
