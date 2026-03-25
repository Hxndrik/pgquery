.PHONY: dev build docker clean

dev:
	@echo "Starting dev servers (Vite :5173, proxy :8080)..."
	@(cd frontend && npm run dev) & (cd proxy && go run .) & wait

build:
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Building Go proxy..."
	cd proxy && CGO_ENABLED=0 go build -ldflags="-s -w" -o pgquery-proxy .

docker:
	docker compose up --build

docker-build:
	docker compose build

clean:
	rm -rf frontend/dist
	rm -f proxy/pgquery-proxy proxy/pgquery-proxy.exe
