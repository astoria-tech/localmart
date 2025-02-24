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
	cd meilisearch && fly deploy

deploy-search:
	cd search && fly deploy

deploy-frontend-prod:
	cd frontend && fly deploy --config fly.prod.toml

deploy-backend-prod:
	cd python-backend && fly deploy --config fly.prod.toml

deploy-pocketbase-prod:
	cd db && fly deploy --config fly.prod.toml

deploy-meilisearch-prod:
	cd meilisearch && fly deploy --config fly.prod.toml

deploy-search-prod:
	cd search && fly deploy --config fly.prod.toml

deploy-all-prod: deploy-frontend-prod deploy-backend-prod deploy-pocketbase-prod deploy-meilisearch-prod deploy-search-prod

# GPG key management
GITHUB_USERS := azlyth

import-gpg-keys:
	@GITHUB_USERS="$(GITHUB_USERS)" ./utils/gpg_manager.sh import-keys

encrypt-file:
	@if [ -z "$(FILE)" ]; then echo "Usage: make encrypt-file FILE=path/to/file"; exit 1; fi
	@GITHUB_USERS="$(GITHUB_USERS)" ./utils/gpg_manager.sh encrypt "$(FILE)"

decrypt-file:
	@if [ -z "$(FILE)" ]; then echo "Usage: make decrypt-file FILE=gpg-secrets/file.gpg"; exit 1; fi
	@./utils/gpg_manager.sh decrypt "$(FILE)"
