import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  const privateKey = process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n')
  if (privateKey && process.env['FIREBASE_CLIENT_EMAIL'] && process.env['FIREBASE_PROJECT_ID']) {
    initializeApp({
      credential: cert({
        projectId: process.env['FIREBASE_PROJECT_ID'],
        clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
        privateKey,
      }),
    })
  } else {
    // Application Default Credentials — works automatically on Firebase App Hosting / GCP
    initializeApp({ projectId: process.env['FIREBASE_PROJECT_ID'] })
  }
}

export const db = getFirestore()
