# Every team fills in the commands for their own stack.
# The CI pipeline calls these targets, so the names must not change.
#
# Examples:
#   Node    install: npm ci          test: npm test        build: npm run build
#   Python  install: pip install -r requirements.txt
#                                    test: pytest          build: echo "no build step"
#   Java    install: ./mvnw -B dependency:go-offline
#                                    test: ./mvnw test     build: ./mvnw package

.PHONY: install test build run docker-build docker-up

install:
	@echo "TODO: install dependencies" && exit 1

test:
	@echo "TODO: run the test suite" && exit 1

build:
	@echo "TODO: build the project" && exit 1

run:
	@echo "TODO: start the app locally" && exit 1

# Needed from M4 onwards
docker-build:
	@echo "TODO: docker build for frontend and backend" && exit 1

docker-up:
	docker compose up --build
