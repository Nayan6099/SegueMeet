import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsIanaTimeZoneConstraint implements ValidatorConstraintInterface {
  validate(timeZone: string) {
    if (typeof timeZone !== 'string') return false;
    try {
      // Intl.DateTimeFormat will throw a RangeError if the timeZone is invalid
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch (e) {
      return false;
    }
  }

  defaultMessage() {
    return 'timeZone must be a valid IANA timezone identifier (e.g., Asia/Kolkata, America/New_York)';
  }
}

export function IsIanaTimeZone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIanaTimeZoneConstraint,
    });
  };
}
