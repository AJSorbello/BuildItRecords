export class DatabaseError extends Error {
  constructor(
    message: string,
    public method: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resourceId: string, resourceType: string) {
    super(`${resourceType} with id ${resourceId} not found`);
    this.name = 'ResourceNotFoundError';
    this.resourceId = resourceId;
    this.resourceType = resourceType;
  }

  public resourceId: string;
  public resourceType: string;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}
