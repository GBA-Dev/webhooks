import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { map, Observable } from 'rxjs';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  getHello(): Observable<any> {
    return this.httpService.get('https://jsonplaceholder.typicode.com/users').pipe(
      map((response: AxiosResponse) => response.data)
    );
  }
}
