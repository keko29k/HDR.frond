import { MetaData } from './metadata.model';

export interface ApiResponse<T> {
  data: T;
  meta: MetaData;
}
