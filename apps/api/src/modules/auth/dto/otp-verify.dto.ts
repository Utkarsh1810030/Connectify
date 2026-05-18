import { IsString, Length, Matches } from 'class-validator';
export class OtpVerifyDto {
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone: string;
  @IsString()
  @Length(6, 6)
  otp: string;
}
