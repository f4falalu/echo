// Import and re-export specific functions from each file
import {
  signInWithEmailAndPassword,
  signInWithGoogle,
  signInWithGithub,
  signInWithAzure,
  signUp,
  signInWithAnonymousUser
} from './signIn';
import { signOut } from './signOut';
import { resetPasswordEmailSend, resetPassword } from './resetPassword';

// Named exports
export {
  signInWithEmailAndPassword,
  signInWithGoogle,
  signInWithGithub,
  signInWithAzure,
  signUp,
  signInWithAnonymousUser,
  signOut,
  resetPasswordEmailSend,
  resetPassword
};
