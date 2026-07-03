.PHONY: setup up down test-db logs clean

setup:
	npm install

up:
	docker compose up -d

down:
	docker compose down

test-db:
	npm run test:db

logs:
	docker compose logs -f

clean:
	docker compose down -v
