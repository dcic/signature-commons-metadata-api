import { Entity, model, property } from '@loopback/repository';

@model()
export class UserProfile extends Entity {
  @property({
    type: 'string',
    id: true,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    description: 'Password hash',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    description: 'Regex pattern of acceptable roles',
    required: true,
  })
  roles: string;

  constructor(data?: Partial<UserProfile>) {
    super(data);
  }
}
