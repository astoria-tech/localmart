all: clean run
deploy-all: deploy-frontend deploy-backend deploy-pocketbase deploy-meilisearch deploy-search

run:
	docker compose up --build

clean:
	docker compose down -t0 --remove-orphans
	docker compose rm -f

clean-data:
	rm -rf ./volumes

deploy-frontend:
	cd frontend && fly deploy

deploy-backend:
	cd python-backend && fly deploy

deploy-pocketbase:
	cd db && fly deploy

deploy-meilisearch:
	cd search/meilisearch && fly deploy

deploy-search:
	cd search && fly deploy