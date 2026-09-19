# Database scripts

Put the PostgreSQL scripts of the project here (for example `schema.sql` for the tables, keys and constraints,
and `seed.example.sql` for **fictitious** demo data). The design is documented in [`../docs/DATABASE.md`](../docs/DATABASE.md).

Load a script into a local database:

```bash
createdb qcm_corrector
psql -d qcm_corrector -f database/schema.sql
```

Rules before committing a script:

- no real students, teachers or e-mail addresses: use fictitious data with `@example.com` addresses;
- no password, not even a hash of a real password;
- never commit a database dump with real data: `npm run check:secrets` rejects `.sql` files outside this folder, rejects `.sqlite`/`.db`/`.dump` files everywhere, and scans the scripts kept here for real-looking e-mail addresses and credentials.
