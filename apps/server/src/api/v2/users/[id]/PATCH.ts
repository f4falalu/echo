import { getUserInformation, updateUser } from '@buster/database/queries';
import {
  GetUserByIdRequestSchema,
  type GetUserByIdResponse,
  UserPatchRequestSchema,
  type UserPatchResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

const app = new Hono()
  .patch(
    '/',
    zValidator('param', GetUserByIdRequestSchema),
    zValidator('json', UserPatchRequestSchema),
    async (c) => {
      const userId = c.req.param('id');
      const authenticatedUser = c.get('busterUser');

      if (authenticatedUser.id !== userId) {
        throw new HTTPException(403, {
          message: 'You are not authorized to update this user',
        });
      }

      const { personalizationEnabled, personalizationConfig, name } = c.req.valid('json');

      // Check for undefined because empty strings are valid updates
      if (
        personalizationEnabled === undefined &&
        personalizationConfig === undefined &&
        name === undefined
      ) {
        throw new HTTPException(400, {
          message: 'No fields to update',
        });
      }

      const currentUser: GetUserByIdResponse = await getUserInformation(userId);
      const updatedPersonalizationConfig = currentUser.personalizationConfig;

      if (personalizationConfig?.currentRole !== undefined) {
        updatedPersonalizationConfig.currentRole = personalizationConfig.currentRole;
      }
      if (personalizationConfig?.customInstructions !== undefined) {
        updatedPersonalizationConfig.customInstructions = personalizationConfig.customInstructions;
      }
      if (personalizationConfig?.additionalInformation !== undefined) {
        updatedPersonalizationConfig.additionalInformation =
          personalizationConfig.additionalInformation;
      }

      const updatedUser: UserPatchResponse = await updateUser({
        userId,
        name,
        personalizationEnabled,
        personalizationConfig: updatedPersonalizationConfig,
      });

      return c.json(updatedUser);
    }
  )
  .onError(standardErrorHandler);

export default app;
