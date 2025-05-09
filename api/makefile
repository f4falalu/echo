dev:
	@echo "Checking/Restarting Redis for dev target..."
	@if ! docker ps -q -f name=buster-redis-make -f status=running > /dev/null; then \
		echo "Redis container 'buster-redis-make' not running. Restarting it..."; \
		docker stop buster-redis-make || true; \
		docker rm buster-redis-make || true; \
		(cd .. && docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && cd api); \
		echo "Redis restarted."; \
	else \
		echo "Redis container 'buster-redis-make' already running."; \
	fi
	@echo "Ensuring Supabase is (re)started for dev target..."
	supabase stop || true
	@echo "Starting Supabase..."
	supabase start
	@echo "Supabase (re)started."
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
	supabase stop

fast:
	@echo "Checking Redis for fast target..."
	@if ! docker ps -q -f name=buster-redis-make -f status=running > /dev/null; then \
		echo "Redis container 'buster-redis-make' not running. Starting it..."; \
		docker stop buster-redis-make || true; \
		docker rm buster-redis-make || true; \
		(cd .. && docker run -d --name buster-redis-make -p 6379:6379 -v buster_redis_data:/data redis && cd api); \
		echo "Redis started."; \
	else \
		echo "Redis container 'buster-redis-make' already running."; \
	fi
	export RUST_LOG=debug && \
	export CARGO_INCREMENTAL=1 && \
	nice cargo watch -C server -x run