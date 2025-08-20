import type { ChangeMessage, ControlMessage, Message, Row } from '@electric-sql/client';
import { describe, expect, it, vi } from 'vitest';
import { handleElectricResponse } from './transform-request';

// Test types
interface TestUser extends Row {
  id: string;
  name: string;
  email: string;
}

interface TransformedUser extends Row {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

// Additional test types for name transformation
interface UserWithSeparateNames extends Row {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface UserWithFullName extends Row {
  id: string;
  fullName: string;
  email: string;
}

describe('handleElectricResponse', () => {
  // Test 1: Basic functionality without transformation
  it('should process messages without transformation and return original data', async () => {
    // Arrange
    const mockMessages: Message<TestUser>[] = [
      {
        headers: { operation: 'insert' },
        value: { id: '1', name: 'John Doe', email: 'john@example.com' },
        key: 'users:1',
      } as ChangeMessage<TestUser>,
      {
        headers: { control: 'up-to-date' },
      } as ControlMessage,
    ];

    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockMessages),
    } as unknown as Response;

    // Act
    const result = await handleElectricResponse<TestUser>(mockResponse);

    // Assert
    expect(mockResponse.json).toHaveBeenCalledOnce();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockMessages[0]);
    expect(result[1]).toEqual(mockMessages[1]);
  });

  // Test 2: With transformation callback
  it('should transform messages using the provided transform callback', async () => {
    // Arrange
    const mockMessages: Message<TestUser>[] = [
      {
        headers: { operation: 'insert' },
        value: { id: '1', name: 'John Doe', email: 'john@example.com' },
        key: 'users:1',
      } as ChangeMessage<TestUser>,
      {
        headers: { operation: 'update' },
        value: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        key: 'users:2',
        old_value: { id: '2', name: 'Jane', email: 'jane@example.com' },
      } as ChangeMessage<TestUser>,
    ];

    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockMessages),
    } as unknown as Response;

    const transformCallback = vi.fn(
      (message: ChangeMessage<TestUser>): TransformedUser => ({
        id: message.value.id,
        fullName: message.value.name,
        email: message.value.email,
        isActive: true,
      })
    );

    const operationCallback = vi.fn();
    const controlCallback = vi.fn();

    // Act
    const result = await handleElectricResponse<TestUser, TransformedUser>(mockResponse, {
      transformCallback,
      operationCallback,
      controlCallback,
    });
    console.log(result);

    // Assert
    expect(mockResponse.json).toHaveBeenCalledOnce();
    expect(transformCallback).toHaveBeenCalledTimes(2);
    expect(operationCallback).toHaveBeenCalledTimes(2);
    expect(controlCallback).not.toHaveBeenCalled();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      headers: { operation: 'insert' },
      value: {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        isActive: true,
      },
      key: 'users:1',
    });
    expect(result[1]).toMatchObject({
      headers: { operation: 'update' },
      value: {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        isActive: true,
      },
      key: 'users:2',
    });

    // Verify operation callback was called with correct parameters
    expect(operationCallback).toHaveBeenNthCalledWith(1, mockMessages[0]);
    expect(operationCallback).toHaveBeenNthCalledWith(2, mockMessages[1]);
  });

  // Test 3: Mixed message types with callbacks
  it('should handle mixed operation and control messages with appropriate callbacks', async () => {
    // Arrange
    const mockMessages: Message<TestUser>[] = [
      {
        headers: { operation: 'insert' },
        value: { id: '1', name: 'John Doe', email: 'john@example.com' },
        key: 'users:1',
      } as ChangeMessage<TestUser>,
      {
        headers: { control: 'up-to-date' },
      } as ControlMessage,
      {
        headers: { control: 'must-refetch' },
      } as ControlMessage,
      {
        headers: { operation: 'delete' },
        value: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        key: 'users:2',
      } as ChangeMessage<TestUser>,
    ];

    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockMessages),
    } as unknown as Response;

    const transformCallback = vi.fn(
      (message: ChangeMessage<TestUser>): TransformedUser => ({
        id: message.value.id,
        fullName: message.value.name,
        email: message.value.email,
        isActive: false,
      })
    );

    const operationCallback = vi.fn();
    const controlCallback = vi.fn();

    // Act
    const result = await handleElectricResponse<TestUser, TransformedUser>(mockResponse, {
      transformCallback,
      operationCallback,
      controlCallback,
    });

    // Assert
    expect(mockResponse.json).toHaveBeenCalledOnce();
    expect(transformCallback).toHaveBeenCalledTimes(2); // Only called for operation messages
    expect(operationCallback).toHaveBeenCalledTimes(2); // Called for INSERT and DELETE
    expect(controlCallback).toHaveBeenCalledTimes(2); // Called for both control messages

    expect(result).toHaveLength(4);

    // Check operation messages were transformed
    expect(result[0]).toMatchObject({
      headers: { operation: 'insert' },
      value: {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        isActive: false,
      },
    });

    expect(result[3]).toMatchObject({
      headers: { operation: 'delete' },
      value: {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        isActive: false,
      },
    });

    // Check control messages were not transformed but passed through
    expect(result[1]).toEqual(mockMessages[1]);
    expect(result[2]).toEqual(mockMessages[2]);

    // Verify callbacks were called with correct parameters
    expect(operationCallback).toHaveBeenNthCalledWith(1, mockMessages[0]);
    expect(operationCallback).toHaveBeenNthCalledWith(2, mockMessages[3]);
    expect(controlCallback).toHaveBeenNthCalledWith(1, mockMessages[1]);
    expect(controlCallback).toHaveBeenNthCalledWith(2, mockMessages[2]);
  });

  // Test 4: Transform separate first and last names to full name
  it('should transform separate first and last names into full name', async () => {
    // Arrange
    const mockMessages: Message<UserWithSeparateNames>[] = [
      {
        headers: { operation: 'insert' },
        value: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
        },
        key: 'users:1',
      } as ChangeMessage<UserWithSeparateNames>,
      {
        headers: { operation: 'update' },
        value: {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
        },
        key: 'users:2',
        old_value: {
          id: '2',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
        },
      } as ChangeMessage<UserWithSeparateNames>,
      {
        headers: { control: 'up-to-date' },
      } as ControlMessage,
    ];

    const mockResponse = {
      json: vi.fn().mockResolvedValue(mockMessages),
    } as unknown as Response;

    const transformCallback = vi.fn(
      (message: ChangeMessage<UserWithSeparateNames>): UserWithFullName => {
        return {
          id: message.value.id,
          fullName: `${message.value.firstName} ${message.value.lastName}`,
          email: message.value.email,
        };
      }
    );

    const operationCallback = vi.fn();
    const controlCallback = vi.fn();

    // Act
    const result = await handleElectricResponse<UserWithSeparateNames, UserWithFullName>(
      mockResponse,
      { transformCallback, operationCallback, controlCallback }
    );

    // Assert
    expect(mockResponse.json).toHaveBeenCalledOnce();
    expect(transformCallback).toHaveBeenCalledTimes(2); // Only called for operation messages
    expect(operationCallback).toHaveBeenCalledTimes(2); // Called for INSERT and UPDATE
    expect(controlCallback).toHaveBeenCalledTimes(1); // Called for control message

    expect(result).toHaveLength(3);

    // Check operation messages were transformed correctly
    expect(result[0]).toMatchObject({
      headers: { operation: 'insert' },
      value: {
        id: '1',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
      },
      key: 'users:1',
    });

    expect(result[1]).toMatchObject({
      headers: { operation: 'update' },
      value: {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      key: 'users:2',
    });

    // Check control message was not transformed but passed through
    expect(result[2]).toEqual(mockMessages[2]);

    // Verify transform callback was called with correct parameters and logic
    expect(transformCallback).toHaveBeenNthCalledWith(1, mockMessages[0]);
    expect(transformCallback).toHaveBeenNthCalledWith(2, mockMessages[1]);

    // Verify operation callback was called with correct parameters
    expect(operationCallback).toHaveBeenNthCalledWith(1, mockMessages[0]);
    expect(operationCallback).toHaveBeenNthCalledWith(2, mockMessages[1]);

    // Verify control callback was called with correct parameters
    expect(controlCallback).toHaveBeenNthCalledWith(1, mockMessages[2]);
  });

  it('simple test to check if the transform callback is called', async () => {
    const myResponse = new Response(
      JSON.stringify([
        {
          headers: {
            operation: 'insert',
          },
          value: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ])
    );

    const transformedData = await handleElectricResponse<
      {
        firstName: string;
        lastName: string;
      },
      {
        firstAndLastName: string;
      }
    >(myResponse, {
      transformCallback: async (message) => {
        return {
          firstAndLastName: `${message.value.firstName} ${message.value.lastName}`,
        };
      },
    });

    console.log(transformedData);

    expect(transformedData).toEqual([
      {
        headers: { operation: 'insert' },
        value: { firstAndLastName: 'John Doe' },
      },
    ]);
  });
});
