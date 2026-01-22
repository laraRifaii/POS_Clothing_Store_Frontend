import { apiService } from './api.service';
import { SignInDto, User } from '../../types/auth.enum';

interface SignInResponse {
  user: User;
}

interface SignUpDto {
  username: string;
  password: string;
  role: string;
}

class AuthApi {
  private readonly AUTH_PREFIX = '/auth';

  /**
   * Sign in user
   */
  async signIn(credentials: SignInDto): Promise<SignInResponse> {
    const response = await apiService.post<SignInResponse>(
      `${this.AUTH_PREFIX}/signin`,
      credentials
    );
    return response;
  }

  /**
   * Sign up new user (Admin only)
   * Requires admin session in x-user header
   */
  async signUp(userData: SignUpDto): Promise<User> {
    const response = await apiService.post<User>(
      `${this.AUTH_PREFIX}/signup`,
      userData
    );
    return response;
  }
}

export const authApi = new AuthApi();