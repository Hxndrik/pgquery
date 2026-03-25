# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.26-alpine AS backend
WORKDIR /app
COPY proxy/ ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o pgquery-proxy .

# Stage 3: Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=backend /app/pgquery-proxy /usr/local/bin/pgquery-proxy
COPY --from=frontend /app/frontend/dist /app/static
ENV PORT=8080
ENV STATIC_DIR=/app/static
EXPOSE 8080
CMD ["pgquery-proxy"]
