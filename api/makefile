dev:
	cd .. && docker compose up -d redis && cd api && \
	supabase start
	supabase db reset 
	export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres && \
	diesel migration run && \
	PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f libs/database/setup.sql && \
	PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres -f libs/database/seed.sql && \
	export RUST_LOG=debug
	export CARGO_INCREMENTAL=1
	nice cargo watch -C server -x run

update-seed:
	PGPASSWORD=postgres pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres \\
	--data-only --no-owner --no-privileges \\
	--exclude-table=schema_migrations \\
	--exclude-table=__diesel_schema_migrations \\
	--exclude-table=migrations \\
	--exclude-table=supabase_migrations.schema_migrations \\
	--exclude-schema=auth \\
	--exclude-schema=storage \\
	--exclude-schema=realtime \\
	--exclude-schema=pgsodium \\
	--exclude-schema=pgsodium_masks \\
	--exclude-schema='pg_*' \\
	--exclude-schema=information_schema \\
	> libs/database/seed.sql

stop:
	docker compose down && \
	supabase stop && \
	pkill ollama

fast:
	cd .. && docker compose up -d redis && cd api && \
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	nice cargo watch -C server -x run