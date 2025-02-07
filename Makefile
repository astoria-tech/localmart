all: clean run
deploy-all: deploy-frontend deploy-backend deploy-pocketbase

run:
	docker compose up --build

clean:
	docker compose down -t0 --remove-orphans
	docker compose rm -f

clean-data:
	rm -rf ./volumes

deploy-frontend:
	fly deploy frontend

deploy-backend:
	fly deploy backend

deploy-pocketbase:
	fly deploy pocketbase