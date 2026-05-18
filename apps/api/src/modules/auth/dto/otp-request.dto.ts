import { IsString, Matches } from 'class-validator';
export class OtpRequestDto {
  @IsString()
  @Matches(/^(\+?91)?[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  phone: string;
}
