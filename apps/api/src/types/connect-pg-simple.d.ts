declare module 'connect-pg-simple' {
  import { Store } from 'express-session';
  import { Pool } from 'pg';

  interface PgStoreOptions {
    pool?: Pool;
    tableName?: string;
    createTableIfMissing?: boolean;
  }

  function connectPg(session: any): new (options?: PgStoreOptions) => Store;
  export = connectPg;
}
