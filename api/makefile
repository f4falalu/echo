dev:
	cd .. && docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && cd api && \
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
	PGPASSWORD=postgres pg_dump -h 127.0.0.1 -p 54322 -U postgres -d postgres \
	--data-only --no-owner --no-privileges \
	--schema=public \
	--exclude-table=schema_migrations \
	--exclude-table=__diesel_schema_migrations \
	--exclude-table=migrations \
	--exclude-table=users \
	> libs/database/seed.sql

stop:
	docker stop buster-redis-make || true && \
	docker rm buster-redis-make || true && \
	cd .. && docker compose down && supabase stop

fast:
	cd .. && docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && cd api && \
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	nice cargo watch -C server -x run