import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor() { }


  // Métodos para futura integración con API
  // getUsersFromAPI(): Observable<User[]> {
  //   return this.http.get<User[]>('/api/users');
  // }

  // createUserInAPI(user: Omit<User, 'id'>): Observable<User> {
  //   return this.http.post<User>('/api/users', user);
  // }

  // updateUserInAPI(id: number, user: Partial<User>): Observable<User> {
  //   return this.http.put<User>(`/api/users/${id}`, user);
  // }

  // deleteUserFromAPI(id: number): Observable<void> {
  //   return this.http.delete<void>(`/api/users/${id}`);
  // }
}
