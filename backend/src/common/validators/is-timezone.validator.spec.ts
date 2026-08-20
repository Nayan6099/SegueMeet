import { IsIanaTimeZoneConstraint } from './is-timezone.validator';

describe('IsIanaTimeZone', () => {
  let constraint: IsIanaTimeZoneConstraint;

  beforeEach(() => {
    constraint = new IsIanaTimeZoneConstraint();
  });

  it('should validate valid IANA timezones', () => {
    expect(constraint.validate('Asia/Kolkata')).toBe(true);
    expect(constraint.validate('America/New_York')).toBe(true);
    expect(constraint.validate('Europe/London')).toBe(true);
    expect(constraint.validate('UTC')).toBe(true);
    expect(constraint.validate('Asia/Calcutta')).toBe(true); // Aliases are valid in Intl
  });

  it('should reject invalid timezones', () => {
    expect(constraint.validate('Invalid/Zone')).toBe(false);
    expect(constraint.validate('America/NewYork')).toBe(false);
    expect(constraint.validate('Local: Asia/Calcutta (UTC+05:30)')).toBe(false);
  });
});
