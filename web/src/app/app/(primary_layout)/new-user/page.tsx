import React from 'react';
import { NewUserController } from './_NewUserController';
import { LoginConfigProvider } from '../../../auth/_LoginComponents/LoginConfigProvider';

export default function NewUserPage() {
  return (
    <LoginConfigProvider>
      <NewUserController />
    </LoginConfigProvider>
  );
}
